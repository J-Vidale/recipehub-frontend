/* eslint-disable react-refresh/only-export-components -- this module
   intentionally exports the useToast hook alongside its provider, the
   conventional React context pattern. The rule only affects Fast Refresh
   granularity during development. */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CloseIcon } from "../components/icons";

const ToastContext = createContext(null);

const DISMISS_AFTER_MS = 5000;

// Replaces window.alert() for action feedback. alert() blocks the whole
// page until dismissed, can't show a success state without being
// obnoxious, and looks like a browser warning rather than part of the
// app. This renders a non-blocking, auto-dismissing region that is
// announced to screen readers via aria-live.
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, tone) => {
      if (!message) return;
      const id = ++idRef.current;
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (message) => push(message, "success"),
      error: (message) => push(message, "error"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* role="status" (polite) rather than "alert" so confirmations don't
          interrupt whatever a screen reader is currently reading. */}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="toast__close"
              aria-label="Dismiss notification"
            >
              <CloseIcon size="0.9rem" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return ctx;
};
