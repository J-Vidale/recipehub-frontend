import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { refusalMessage } from "../lib/refusalMessage";

const FollowButton = ({ userId, initialFollowingByMe = false, onFollowerCountChange }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [followingByMe, setFollowingByMe] = useState(initialFollowingByMe);
  const [busy, setBusy] = useState(false);

  if (user && user._id === userId) {
    return null; // Can't follow yourself
  }

  const handleToggle = async () => {
    const previouslyFollowing = followingByMe;
    // Optimistic: flip the UI immediately, revert if the request fails.
    //
    // The callback is told either a delta or a settled count. A delta is a
    // guess made before the server has answered; a count is what the server
    // says is true. Both are needed: the guess is what makes the button
    // feel immediate, and the count is what corrects it - without it, two
    // people following the same person at once each saw only their own +1
    // and the number stayed wrong until a reload.
    setFollowingByMe(!previouslyFollowing);
    onFollowerCountChange?.({ delta: previouslyFollowing ? -1 : 1 });
    setBusy(true);
    try {
      const res = previouslyFollowing
        ? await API.delete(`/users/${userId}/follow`)
        : await API.post(`/users/${userId}/follow`, {});
      setFollowingByMe(res.data.followingByMe);
      if (Number.isFinite(res.data?.followerCount)) {
        onFollowerCountChange?.({ count: res.data.followerCount });
      }
    } catch (err) {
      setFollowingByMe(previouslyFollowing);
      onFollowerCountChange?.({ delta: previouslyFollowing ? 1 : -1 });
      // Following someone who has blocked you is refused with a reason.
      // Without this the button flipped back and said nothing, which reads
      // as the button being broken.
      const reason = refusalMessage(err);
      if (reason) toast.error(reason);
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
