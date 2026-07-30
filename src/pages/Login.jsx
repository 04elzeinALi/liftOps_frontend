import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { getApiErrorMessage } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ThemeToggle from "@/components/ThemeToggle";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      // A wrong password gets Laravel's real message; a network/CORS/DNS
      // failure (no response at all) falls back to a generic message instead
      // of falsely blaming the password — those are very different problems
      // to fix, and blaming credentials cost us real debugging time once.
      setError(getApiErrorMessage(err, "Couldn't reach the server. Please check your connection and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4" style={{ background: "var(--bg)" }}>
      {/* a bus, faint and yellow-washed, sitting behind the whole page */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 320"
        className="pointer-events-none absolute select-none"
        style={{
          right: "-8%",
          bottom: "-6%",
          width: "min(880px, 110vw)",
          height: "auto",
          color: "var(--accent)",
          opacity: 0.14,
        }}
      >
        <rect x="30" y="70" width="500" height="170" rx="26" fill="currentColor" />
        <path d="M30 130 L60 70 H500 a26 26 0 0 1 26 26 v34 H30 Z" fill="currentColor" />
        <g fill="var(--bg)">
          <rect x="80" y="90" width="70" height="55" rx="8" />
          <rect x="170" y="90" width="70" height="55" rx="8" />
          <rect x="260" y="90" width="70" height="55" rx="8" />
          <rect x="350" y="90" width="70" height="55" rx="8" />
          <rect x="440" y="90" width="60" height="55" rx="8" />
        </g>
        <rect x="60" y="165" width="60" height="70" rx="6" fill="var(--bg)" />
        <circle cx="140" cy="248" r="34" fill="currentColor" />
        <circle cx="420" cy="248" r="34" fill="currentColor" />
        <circle cx="140" cy="248" r="13" fill="var(--bg)" />
        <circle cx="420" cy="248" r="13" fill="var(--bg)" />
        <rect x="505" y="150" width="16" height="10" rx="2" fill="var(--bg)" />
      </svg>

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-sm">
        <h1 className="font-display mb-2 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Welcome to LiftOps
        </h1>
        <p className="font-display mb-1 text-xl font-bold leading-snug" style={{ color: "var(--accent)" }}>
          Your secure means of transportation.
        </p>
        <p className="mb-7 text-sm" style={{ color: "var(--text-muted)" }}>
          Sign in to access your dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm" style={{ color: "var(--critical)" }}>
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
          Want a lift but don't have an account?{" "}
          <Link to="/signup" className="font-semibold" style={{ color: "var(--accent)" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
