import React, { useState } from "react";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { MIN_PASSWORD_LENGTH } from "../lib/credentials";

// Changing your password, for the case that matters: you think someone
// else has it. Saving a new one ends every other session, which is the
// point - so the copy says so rather than leaving it to be discovered.
const ChangePassword = () => {
  const toast = useToast();
  const { replaceToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setOpen(false);
    setCurrent("");
    setNext("");
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!current || !next) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await API.patch("/auth/password", {
        currentPassword: current,
        newPassword: next,
      });
      // The server ends every session minted before the change, this one
      // included, and hands back a replacement so the person who made the
      // change is not signed out by it. Through the context rather than
      // straight to storage: it also closed this tab's socket, and only a
      // token the tree can see will prompt a new one.
      if (data?.token) replaceToken(data.token);
      toast.success(data?.message || "Password changed.");
      close();
    } catch (err) {
      setError(err?.message || "Could not change your password.");
      setSaving(false);
    }
  };

  return (
    <section className="card mt-8">
      <h2 className="content-title mb-2">Password</h2>
      <p className="text-soft text-sm mb-4">
        Changing it signs out every other device signed in as you. Use this if
        you think someone else knows your password.
      </p>

      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-secondary">
          Change password
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
          <div>
            <label className="field__label" htmlFor="current-password">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              className={`input${error ? " input--invalid" : ""}`}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "change-password-error" : undefined}
              required
            />
          </div>

          <div>
            <label className="field__label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={next}
              onChange={(event) => setNext(event.target.value)}
              className="input"
              aria-describedby="new-password-hint"
              required
            />
            <p className="field__hint" id="new-password-hint">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          </div>

          {error && (
            <p className="field__error" id="change-password-error" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={saving || !current || !next} className="btn-primary">
              {saving ? "Changing..." : "Change password"}
            </button>
            <button type="button" onClick={close} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default ChangePassword;
