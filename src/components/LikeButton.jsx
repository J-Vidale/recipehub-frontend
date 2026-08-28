import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const LikeButton = ({ recipeId, initialLikeCount, initialLikedByMe = false }) => {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likedByMe, setLikedByMe] = useState(initialLikedByMe);
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    const previouslyLiked = likedByMe;
    const previousCount = likeCount;
    // Optimistic: flip the UI immediately, revert if the request fails.
    setLikedByMe(!previouslyLiked);
    setLikeCount(previousCount + (previouslyLiked ? -1 : 1));
    setBusy(true);
    try {
      const res = previouslyLiked
        ? await API.delete(`/recipes/${recipeId}/like`)
        : await API.post(`/recipes/${recipeId}/like`, {});
      setLikedByMe(res.data.likedByMe);
      setLikeCount(res.data.likeCount);
    } catch {
      setLikedByMe(previouslyLiked);
      setLikeCount(previousCount);
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <Link to="/login" className="inline-flex items-center gap-1 text-gray-600 hover:text-green-700">
        <span aria-hidden="true">♡</span> {likeCount} {likeCount === 1 ? "like" : "likes"}
      </Link>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded disabled:opacity-60 ${
        likedByMe ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      <span aria-hidden="true">{likedByMe ? "♥" : "♡"}</span>
      {likeCount} {likeCount === 1 ? "like" : "likes"}
    </button>
  );
};

export default LikeButton;
