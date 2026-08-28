import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useSocket } from "../context/SocketContext";

const POLL_INTERVAL_MS = 45000;

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await API.get("/notifications/unread-count");
        if (!cancelled) setUnreadCount(res.data.count);
      } catch (err) {
        // Silent - a missed badge update isn't worth surfacing an error for.
      }
    };

    fetchCount();
    // The poll stays as the source of truth regardless of socket state -
    // it's what guarantees the badge is eventually correct even if a
    // live event is missed (a dropped connection during a free-tier
    // sleep, a tab that was closed when the event fired, etc.).
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    // Live update: bump the badge immediately instead of waiting for the
    // next poll. The poll above still re-syncs periodically regardless.
    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };
    socket.on("notification:new", handleNewNotification);
    return () => socket.off("notification:new", handleNewNotification);
  }, [socket]);

  return (
    <Link to="/notifications" className="relative inline-flex items-center" aria-label="Notifications">
      <span aria-hidden="true">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.1rem] text-center leading-tight">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
