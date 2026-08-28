import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const FollowButton = ({ userId, initialFollowingByMe = false, onFollowerCountChange }) => {
  const { user } = useAuth();
  const [followingByMe, setFollowingByMe] = useState(initialFollowingByMe);
  const [busy, setBusy] = useState(false);

  if (user && user._id === userId) {
    return null; // Can't follow yourself
  }

  const handleToggle = async () => {
    const previouslyFollowing = followingByMe;
    // Optimistic: flip the UI immediately, revert if the request fails.
    setFollowingByMe(!previouslyFollowing);
    onFollowerCountChange?.(previouslyFollowing ? -1 : 1);
    setBusy(true);
    try {
      const res = previouslyFollowing
        ? await API.delete(`/users/${userId}/follow`)
        : await API.post(`/users/${userId}/follow`, {});
      setFollowingByMe(res.data.followingByMe);
    } catch {
      setFollowingByMe(previouslyFollowing);
      onFollowerCountChange?.(previouslyFollowing ? 1 : -1);
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <Link to="/login" className="btn-primary">
        Log in to follow
      </Link>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={followingByMe ? "btn-secondary" : "btn-primary"}
    >
      {followingByMe ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
