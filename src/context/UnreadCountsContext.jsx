/* eslint-disable react-refresh/only-export-components -- this module
   intentionally exports the useUnreadCounts hook alongside its provider,
   the conventional React context pattern. The rule only affects Fast
   Refresh granularity during development. */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const UnreadCountsContext = createContext({ notifications: 0, messages: 0 });

const POLL_INTERVAL_MS = 45000;

// The unread counts used to live inside NotificationBell and MessageBadge,
// each owning its own interval. Once the navbar started rendering a
// desktop and a mobile copy of both (only one visible, but both mounted),
// that became four polls every 45 seconds instead of two, for as long as
// the tab stayed open. Polling once here and letting any number of badges
// read the result makes the traffic independent of how many places choose
// to display it.
export const UnreadCountsProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id;
  const socket = useSocket();
  const [counts, setCounts] = useState({ notifications: 0, messages: 0 });

  useEffect(() => {
    if (!userId) {
      setCounts({ notifications: 0, messages: 0 });
      return;
    }

    let cancelled = false;

    const fetchCounts = async () => {
      const [notifications, messages] = await Promise.all([
        API.get("/notifications/unread-count")
          .then((res) => res.data.count)
          .catch(() => null),
        API.get("/conversations/unread-count")
          .then((res) => res.data.count)
          .catch(() => null),
      ]);
      if (cancelled) return;
      // A failed request leaves the previous value alone rather than
      // resetting the badge to zero: a missed poll isn't evidence that
      // everything has been read.
      setCounts((prev) => ({
        notifications: notifications ?? prev.notifications,
        messages: messages ?? prev.messages,
      }));
    };

    fetchCounts();
    // The poll remains the source of truth regardless of socket state -
    // it's what guarantees the badges are eventually correct even if a
    // live event is missed (a dropped connection during a free-tier
    // sleep, a tab that was closed when the event fired).
    const interval = setInterval(fetchCounts, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  useEffect(() => {
    if (!socket || !userId) return;

    // Live bumps so a badge reacts immediately instead of waiting up to
    // 45 seconds. A message arriving for a conversation the recipient
    // already has open over-counts by one until the next poll corrects
    // it - cheap, and self-correcting.
    const onNotification = () =>
      setCounts((prev) => ({ ...prev, notifications: prev.notifications + 1 }));
    const onMessage = () =>
      setCounts((prev) => ({ ...prev, messages: prev.messages + 1 }));

    socket.on("notification:new", onNotification);
    socket.on("message:new", onMessage);
    return () => {
      socket.off("notification:new", onNotification);
      socket.off("message:new", onMessage);
    };
  }, [socket, userId]);

  const value = useMemo(
    () => ({ notifications: counts.notifications, messages: counts.messages }),
    [counts.notifications, counts.messages]
  );

  return (
    <UnreadCountsContext.Provider value={value}>{children}</UnreadCountsContext.Provider>
  );
};

export const useUnreadCounts = () => useContext(UnreadCountsContext);
