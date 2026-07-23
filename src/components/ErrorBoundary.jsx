import { Component } from "react";

// Catches render-time errors anywhere below it so a single component throw
// shows a recoverable message instead of a blank white screen. Class
// component because React only exposes error boundaries via lifecycle
// methods (getDerivedStateFromError / componentDidCatch).
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Left as console output — no error-reporting service is wired up.
    console.error("Uncaught render error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center px-4" style={{ background: "var(--bg)" }}>
          <div className="w-full max-w-sm text-center">
            <h1 className="font-display mb-2 text-2xl font-extrabold" style={{ color: "var(--text)" }}>
              Something went wrong
            </h1>
            <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
              An unexpected error occurred. Reloading usually fixes it.
            </p>
            <button
              onClick={this.handleReload}
              className="rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
