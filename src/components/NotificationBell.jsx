import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const POLL_INTERVAL_MS = 45000;

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);

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
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
