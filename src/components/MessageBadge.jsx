import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useSocket } from "../context/SocketContext";

const POLL_INTERVAL_MS = 45000;

const MessageBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await API.get("/conversations/unread-count");
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

  useEffect(() => {
    if (!socket) return;
    // Same tradeoff as NotificationBell: a live message for a conversation
    // the recipient already has open would over-count by one until the
    // next poll corrects it (ConversationView marks it read on arrival,
    // but doesn't reach back into this badge's count). Simple, and
    // self-correcting within POLL_INTERVAL_MS - not worth the extra
    // network round trip of re-fetching on every single message.
    const handleNewMessage = () => {
      setUnreadCount((prev) => prev + 1);
    };
    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [socket]);

  return (
    <Link to="/messages" className="relative inline-flex items-center" aria-label="Messages">
      <span aria-hidden="true">✉️</span>
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.1rem] text-center leading-tight">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default MessageBadge;
