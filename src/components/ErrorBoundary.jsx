import React from "react";
import { captureError } from "../lib/monitoring";
import { isStaleDeployError, recoverFromStaleDeploy } from "../lib/staleDeploy";

// React error boundaries still require a class component - there is no
// hook-based equivalent as of React 19. Kept deliberately small: one
// boundary around the routed page content, not one per page, since this
// app doesn't have volatile per-page regions that need independent
// recovery.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, stale: false };
  }

  static getDerivedStateFromError(error) {
    // A chunk that will not load is almost always a deploy landing while
    // the tab was open, not a fault. It reads differently and it recovers
    // differently, so it is tracked apart from a real crash.
    return { hasError: true, stale: isStaleDeployError(error) };
  }

  componentDidCatch(error, info) {
    if (isStaleDeployError(error)) {
      // Not a defect, and not worth a report: the build the tab is holding
      // is simply older than the one on the server. Try the reload that
      // fixes it. If one was already spent, the fallback below asks.
      if (recoverFromStaleDeploy()) return;
      return;
    }
    console.error("Unhandled error in app:", error, info);
    // The fallback below tells the reader something broke; this is what
    // tells us what it was. A no-op unless a DSN is configured.
    captureError(error, { componentStack: info?.componentStack });
  }

  handleReload = () => {
    this.setState({ hasError: false, stale: false });
    window.location.assign("/");
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.stale) {
      return (
        <div className="page-container max-w-lg flex flex-col items-center justify-center text-center">
          <h1 className="card-title mb-4">This page has been updated</h1>
          <p className="text-soft mb-6">
            A newer version of the site went live while this tab was open.
            Refreshing loads it - nothing you were doing has been lost.
          </p>
          <button onClick={this.handleRefresh} className="btn-primary">
            Refresh
          </button>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className="page-container flex flex-col items-center justify-center text-center">
          <h1 className="card-title mb-4">
            Something went wrong
          </h1>
          <p className="text-soft mb-6">
            An unexpected error occurred. Try going back to the homepage.
          </p>
          <button onClick={this.handleReload} className="btn-primary">
            Go Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
