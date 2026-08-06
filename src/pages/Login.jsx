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
    <div className="relative grid min-h-screen place-items-center px-4" style={{ background: "var(--bg)" }}>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div
        className="w-full max-w-sm rounded-2xl p-7"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <img src="/logo.png" alt="" className="mb-4 h-12 w-12 rounded-xl" />
        <h1 className="font-display mb-2 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Welcome to Lift-Ops
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
