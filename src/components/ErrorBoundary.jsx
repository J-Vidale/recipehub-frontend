import React from "react";

// React error boundaries still require a class component - there is no
// hook-based equivalent as of React 19. Kept deliberately small: one
// boundary around the routed page content, not one per page, since this
// app doesn't have volatile per-page regions that need independent
// recovery.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled error in app:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold text-green-700 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
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
