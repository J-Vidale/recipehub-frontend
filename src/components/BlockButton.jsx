import React, { useState } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";

const BlockButton = ({ userId, initialBlockedByMe = false, onBlockedChange }) => {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  // Seeded from the profile. It used to start false whatever the truth
  // was, so after a reload the button said "Block" about someone already
  // blocked - and unblocking, which is this same button in its other
  // state, could not be reached at all.
  const [blocked, setBlocked] = useState(initialBlockedByMe);

  const handleToggle = async () => {
    const action = blocked
      ? window.confirm("Unblock this user?")
      : window.confirm("Block this user? They won't be able to follow or comment on your recipes, and any existing follow between you will be removed.");
    if (!action) return;

    setBusy(true);
    try {
      if (blocked) {
        await API.delete(`/users/${userId}/block`);
        setBlocked(false);
        toast.success("User unblocked.");
        onBlockedChange?.(false);
      } else {
        await API.post(`/users/${userId}/block`, {});
        setBlocked(true);
        toast.success("User blocked.");
        onBlockedChange?.(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update block status.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className="tap-target text-xs text-muted hover:text-danger disabled:opacity-60"
    >
      {blocked ? "Unblock" : "Block"}
    </button>
  );
};

export default BlockButton;
