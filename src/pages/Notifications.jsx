import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useSocket } from "../context/SocketContext";

const describeNotification = (n) => {
  const actorName = n.actor?.username || "Someone";
  const recipeTitle = n.recipe?.title;
  switch (n.type) {
    case "like":
      return `${actorName} liked your recipe${recipeTitle ? ` "${recipeTitle}"` : ""}`;
    case "follow":
      return `${actorName} started following you`;
    case "comment":
      return `${actorName} commented on your recipe${recipeTitle ? ` "${recipeTitle}"` : ""}`;
    case "reply":
      return `${actorName} replied to your comment${recipeTitle ? ` on "${recipeTitle}"` : ""}`;
    case "share":
      return `${actorName} shared your recipe${recipeTitle ? ` "${recipeTitle}"` : ""}`;
    default:
      return `${actorName} interacted with your content`;
  }
};

const notificationLink = (n) => {
  if (n.type === "follow") return `/users/${n.actor._id}`;
  if (n.recipe?._id) return `/recipes/${n.recipe._id}`;
  return null;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };
    socket.on("notification:new", handleNewNotification);
    return () => socket.off("notification:new", handleNewNotification);
  }, [socket]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications");
        setNotifications(res.data.notifications);
        setNextCursor(res.data.nextCursor);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        setError("Couldn't load your notifications. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await API.get("/notifications", { params: { cursor: nextCursor } });
      setNotifications((prev) => [...prev, ...res.data.notifications]);
      setNextCursor(res.data.nextCursor);
    } catch (err) {
      console.error("Failed to load more notifications:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    try {
      await API.post(`/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await API.post("/notifications/read-all");
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-green-700">Notifications</h2>
        {notifications.some((n) => !n.read) && (
          <button onClick={handleMarkAllAsRead} className="text-sm text-green-700 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-600">No notifications yet.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {notifications.map((n) => {
              const link = notificationLink(n);
              const content = (
                <div className={`card-sm flex items-start gap-3 ${n.read ? "" : "border border-green-200 bg-green-50"}`}>
                  {n.actor?.avatarUrl ? (
                    <img src={n.actor.avatarUrl} alt={n.actor.username} className="avatar avatar-sm" />
                  ) : (
                    <span className="avatar avatar-sm">{n.actor?.username?.[0]?.toUpperCase() || "?"}</span>
                  )}
                  <div>
                    <p className="text-gray-800">{describeNotification(n)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
              return (
                <li key={n._id} onClick={() => !n.read && handleMarkAsRead(n._id)}>
                  {link ? (
                    <Link to={link} className="block">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
          {nextCursor && (
            <div className="flex justify-center mt-6">
              <button onClick={loadMore} disabled={loadingMore} className="btn-primary">
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Notifications;
