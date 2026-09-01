import React from "react";
import { Link } from "react-router-dom";
import { BellIcon } from "./icons";
import { useUnreadCounts } from "../context/UnreadCountsContext";

// Presentation only: the count is polled once in UnreadCountsProvider, so
// rendering this in both the desktop bar and the mobile action row costs
// no extra network traffic.
const NotificationBell = () => {
  const { notifications: unreadCount } = useUnreadCounts();

  return (
    <Link to="/notifications" className="navbar__badge" aria-label="Notifications">
      <BellIcon size="1.15rem" />
      {unreadCount > 0 && (
        <span className="navbar__badge-count">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
