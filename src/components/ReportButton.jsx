import React, { useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const ReportButton = ({ targetType, targetId }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await API.post("/reports", { targetType, targetId, reason: reason.trim() });
      setSubmitted(true);
      setOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <span className="text-xs text-gray-500">Reported. Thanks for letting us know.</span>;
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-gray-500 hover:text-red-600"
      >
        Report
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 max-w-xs">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you reporting this?"
            maxLength={500}
            rows={3}
            className="border p-2 rounded text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="px-3 py-1 rounded bg-red-600 text-white text-sm disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit report"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReportButton;
