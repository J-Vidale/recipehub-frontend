import React, { useState } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

// `ownerId` is who the reported thing belongs to. The server refuses a
// report of your own content, so without it the button was offered on
// your own recipe and the only way to find out was to write a reason and
// be told no. The profile page had always hidden it behind its own
// "is this me" check; this puts that in one place for every caller.
const ReportButton = ({ targetType, targetId, ownerId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;
  if (ownerId && String(ownerId) === String(user._id)) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      const response = await API.post("/reports", {
        targetType,
        targetId,
        reason: reason.trim(),
      });
      setSubmitted(true);
      setOpen(false);
      // The server's own wording, because a second report of the same
      // thing succeeds with "You have already reported this" rather than
      // failing - and saying "Report submitted" to that is a small lie.
      toast.success(
        response?.data?.message
          ? `${response.data.message}. Thanks for letting us know.`
          : "Report submitted. Thanks for letting us know."
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <span className="text-xs text-muted">Reported. Thanks for letting us know.</span>;
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="tap-target text-xs text-muted hover:text-danger"
      >
        Report
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 max-w-xs">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-label="Why are you reporting this?"
            placeholder="Why are you reporting this?"
            maxLength={500}
            rows={3}
            className="input text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="btn-danger"
            >
              {submitting ? "Submitting..." : "Submit report"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReportButton;
