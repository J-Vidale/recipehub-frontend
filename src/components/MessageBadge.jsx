import React from "react";
import { Link } from "react-router-dom";
import { MailIcon } from "./icons";
import { useUnreadCounts } from "../context/UnreadCountsContext";

// Presentation only - see NotificationBell: both counts come from a
// single poll in UnreadCountsProvider.
const MessageBadge = () => {
  const { messages: unreadCount } = useUnreadCounts();

  return (
    <Link to="/messages" className="navbar__badge" aria-label="Messages">
      <MailIcon size="1.15rem" />
      {unreadCount > 0 && (
        <span className="navbar__badge-count">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default MessageBadge;
