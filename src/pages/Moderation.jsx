import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Seo from "../components/Seo";
import { useToast } from "../context/ToastContext";
import { asArray, asCursor } from "../lib/apiShape";

// The queue of things members have reported.
//
// Before this, reports were written and nobody could read them, while the
// reporter was told their report had been received. The page is plain on
// purpose: a moderator needs to see what was reported, who said what about
// it, and mark it handled - not a dashboard.

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "reviewed", label: "Reviewed" },
];

// What to show for the thing that was reported, which differs by kind and
// may be gone entirely.
const describeTarget = (report) => {
  const { targetType, target } = report;
  if (!target) {
    return { text: "This has already been deleted.", to: null, missing: true };
  }
  if (targetType === "recipe") {
    return { text: target.title || "Untitled recipe", to: `/recipes/${target._id}` };
  }
  if (targetType === "user") {
    return { text: target.username || "Unnamed member", to: `/users/${target._id}` };
  }
  return { text: target.text || "Empty comment", to: target.recipe ? `/recipes/${target.recipe}` : null };
};

const Moderation = () => {
  const toast = useToast();
  const [status, setStatus] = useState("open");
  const [reports, setReports] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [notForYou, setNotForYou] = useState(false);

  const load = useCallback(async (nextStatus, nextCursor = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/reports", {
        params: { status: nextStatus, ...(nextCursor ? { cursor: nextCursor } : {}) },
      });
      const page = asArray(res.data?.reports);
      setReports((current) => (nextCursor ? [...current, ...page] : page));
      setCursor(asCursor(res.data?.nextCursor));
      setHasMore(Boolean(res.data?.hasMore));
    } catch (err) {
      // A non-moderator gets 404 from the gate, which is deliberate - the
      // endpoints read as absent rather than forbidden.
      // ApiError carries the code under response.status, not status.
      // 404 is what the gate answers someone who is not a moderator: the
      // endpoints read as absent rather than forbidden, so that a 403
      // does not confirm they exist.
      if (err?.response?.status === 404) {
        setNotForYou(true);
        return;
      }
      setError(err?.message || "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(status);
  }, [load, status]);

  const setReportStatus = async (reportId, nextStatus) => {
    setUpdatingId(reportId);
    try {
      await API.patch(`/reports/${reportId}`, { status: nextStatus });
      // It no longer belongs in the list being viewed.
      setReports((current) => current.filter((report) => report._id !== reportId));
      toast.success(nextStatus === "reviewed" ? "Marked reviewed." : "Reopened.");
    } catch (err) {
      toast.error(err?.message || "Could not update that report.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Deliberately not gated on user.isAdmin. That value lives in
  // localStorage, where the reader can edit it, so treating it as
  // permission would be trusting the wrong party. It decides whether to
  // offer the link in the navigation and nothing more; the server answers
  // 404 to anyone who should not be here, and that answer is what this
  // page shows.
  if (notForYou) {
    return (
      <div className="page-container max-w-3xl text-center text-soft">
        <Seo title="Moderation" description="Reports members have filed." noindex />
        <p>This page is for moderators.</p>
        <Link to="/" className="btn-secondary mt-4">Go home</Link>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      <Seo title="Moderation" description="Reports members have filed." noindex />
      <h1 className="page-title mb-2">Moderation</h1>
      <p className="page-lede mb-6">What members have reported, newest first.</p>

      <div className="flex gap-2 mb-6" role="group" aria-label="Filter by status">
        {STATUSES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatus(option.value)}
            aria-pressed={status === option.value}
            className={status === option.value ? "btn-primary" : "btn-secondary"}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <p className="text-danger mb-4">{error}</p>}

      {loading && reports.length === 0 && <p className="text-soft">Loading...</p>}

      {!loading && !error && reports.length === 0 && (
        <p className="text-soft">
          {status === "open" ? "Nothing reported. Nothing to do." : "Nothing marked reviewed yet."}
        </p>
      )}

      <ul className="space-y-4">
        {reports.map((report) => {
          const target = describeTarget(report);
          return (
            <li key={report._id} className="card-sm">
              <p className="text-xs text-muted mb-1">
                {report.targetType} reported by {report.reporter?.username || "a member"}
                {report.createdAt ? ` on ${new Date(report.createdAt).toLocaleDateString()}` : ""}
              </p>

              <p className="font-semibold text-strong break-words mb-1">
                {target.to ? (
                  <Link to={target.to}>{target.text}</Link>
                ) : (
                  <span className={target.missing ? "text-muted" : undefined}>{target.text}</span>
                )}
              </p>

              {/* The reason is what the reporter said, not what was
                  reported. Keeping them visibly apart matters when both
                  are free text from different people. */}
              <p className="text-soft text-sm break-words mb-3">
                <span className="text-muted">Reason given: </span>
                {report.reason}
              </p>

              <button
                type="button"
                onClick={() => setReportStatus(report._id, status === "open" ? "reviewed" : "open")}
                disabled={updatingId === report._id}
                className="btn-secondary"
              >
                {updatingId === report._id
                  ? "Saving..."
                  : status === "open"
                    ? "Mark reviewed"
                    : "Reopen"}
              </button>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => load(status, cursor)}
          disabled={loading}
          className="btn-secondary mt-6"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
};

export default Moderation;
