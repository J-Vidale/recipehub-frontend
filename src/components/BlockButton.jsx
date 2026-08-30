import React, { useState } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";

const BlockButton = ({ userId, onBlockedChange }) => {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);

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
      className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-60"
    >
      {blocked ? "Unblock" : "Block"}
    </button>
  );
};

export default BlockButton;
