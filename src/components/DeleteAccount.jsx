import React, { useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { setHandoff } from "../lib/handoff";

// Deleting an account is the one thing on this site with no undo, so the
// design is deliberately slower than everything else around it: it is
// closed by default, it says in plain words what goes, and it asks for
// the password rather than a confirmation click. A dialog that can be
// dismissed by accident is the wrong shape for this.
const DeleteAccount = () => {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!password) return;
    setDeleting(true);
    setError(null);
    try {
      // The body travels on a DELETE, which is unusual but allowed, and
      // keeps the password out of the URL where it would reach logs.
      await API.delete("/users/me", { data: { password } });
      // A full load rather than a route change. This page sits behind
      // ProtectedRoute, which renders a redirect to the login screen the
      // instant the session clears - so every in-app ending here finished
      // by asking someone to log into the account they had just deleted.
      // Reloading into a fresh app is the honest end state anyway: no
      // stale context, no cached queries, nothing still holding a dead
      // session. The confirmation is handed to the next load, since the
      // reload would take a toast with it.
      setHandoff("Your account and everything in it has been deleted.");
      logout();
      window.location.replace("/");
    } catch (err) {
      setError(err?.message || "Could not delete your account. Try again.");
      setDeleting(false);
    }
  };

  return (
    <section className="card card--danger mt-8">
      <h2 className="content-title mb-2">Delete your account</h2>
      <p className="text-soft text-sm mb-4">
        This removes your account and everything in it: your recipes and their
        photos, your comments, your likes and saves, who you follow, and your
        messages. Anyone who saved one of your recipes will lose it. There is
        no undo and nothing is kept.
      </p>

      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-danger">
          Delete my account
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
          <label className="field__label" htmlFor="delete-account-password">
            Enter your password to confirm
          </label>
          <input
            id="delete-account-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`input${error ? " input--invalid" : ""}`}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "delete-account-error" : undefined}
            required
          />
          {error && (
            <p className="field__error" id="delete-account-error">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={deleting || !password} className="btn-danger">
              {deleting ? "Deleting..." : "Delete my account permanently"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setPassword("");
                setError(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default DeleteAccount;
