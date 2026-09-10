import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ShareIcon } from "./icons";

const ShareButton = ({ recipeId, initialShareCount, initialSharedByMe = false }) => {
  const { user } = useAuth();
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [sharedByMe, setSharedByMe] = useState(initialSharedByMe);
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    const previouslyShared = sharedByMe;
    const previousCount = shareCount;
    // Optimistic: flip the UI immediately, revert if the request fails.
    setSharedByMe(!previouslyShared);
    setShareCount(previousCount + (previouslyShared ? -1 : 1));
    setBusy(true);
    try {
      const res = previouslyShared
        ? await API.delete(`/recipes/${recipeId}/share`)
        : await API.post(`/recipes/${recipeId}/share`, {});
      setSharedByMe(res.data.sharedByMe);
      setShareCount(res.data.shareCount);
    } catch {
      setSharedByMe(previouslyShared);
      setShareCount(previousCount);
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <Link to="/login" className="inline-flex items-center gap-1 text-soft hover:text-brand">
        <ShareIcon /> {shareCount} {shareCount === 1 ? "share" : "shares"}
      </Link>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded disabled:opacity-60 ${
        sharedByMe ? "surface-brand text-brand" : "surface-2 text-strong"
      }`}
    >
      <ShareIcon />
      {sharedByMe ? "Shared" : "Share"} · {shareCount}
    </button>
  );
};

export default ShareButton;
