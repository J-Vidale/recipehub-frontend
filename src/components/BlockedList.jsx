import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { asArray } from "../lib/apiShape";
import { avatarImage } from "../lib/images";

// Who you have blocked.
//
// Blocking was reachable from someone's profile and nowhere else, so
// reviewing it meant remembering who you had blocked and going to find
// them. The endpoint that answers this existed from the start and nothing
// called it.
const BlockedList = () => {
  const toast = useToast();
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState(null);

  useEffect(() => {
    let cancelled = false;
    API.get("/users/blocked")
      .then((res) => {
        if (!cancelled) setBlocked(asArray(res.data));
      })
      // Silent: this is a secondary panel on the profile, and a banner
      // because it did not load would be louder than the thing is worth.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unblock = async (userId, username) => {
    const previous = blocked;
    setUnblocking(userId);
    setBlocked((current) => current.filter((person) => person._id !== userId));
    try {
      await API.delete(`/users/${userId}/block`);
      toast.success(`${username} unblocked.`);
    } catch (err) {
      setBlocked(previous);
      toast.error(err?.message || "Could not unblock that member.");
    } finally {
      setUnblocking(null);
    }
  };

  // Nothing to say when you have blocked nobody, which is most people.
  if (loading || blocked.length === 0) return null;

  return (
    <section className="card mt-8">
      <h2 className="content-title mb-2">Blocked members</h2>
      <p className="text-soft text-sm mb-4">
        They cannot follow you, message you, or comment on, like or share
        your recipes.
      </p>
      <ul className="space-y-2">
        {blocked.map((person) => (
          <li key={person._id} className="flex items-center gap-3 min-w-0">
            {person.avatarUrl ? (
              <img src={avatarImage(person.avatarUrl, 56)} alt="" className="avatar avatar-xs" />
            ) : (
              <span className="avatar avatar-xs">
                {person.username?.[0]?.toUpperCase() || "?"}
              </span>
            )}
            <Link to={`/users/${person._id}`} className="flex-1 min-w-0 break-words">
              {person.username}
            </Link>
            <button
              type="button"
              onClick={() => unblock(person._id, person.username)}
              disabled={unblocking === person._id}
              className="btn-secondary"
            >
              {unblocking === person._id ? "Unblocking..." : "Unblock"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default BlockedList;
