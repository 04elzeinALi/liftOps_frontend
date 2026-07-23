import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { parseApiError } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  password: "",
  password_confirmation: "",
};

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      const { fieldErrors, message } = parseApiError(err);
      setErrors(fieldErrors ?? {});
      setGeneralError(message ?? "");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <p
          className="mb-2 text-xs font-semibold uppercase"
          style={{ color: "var(--accent)", letterSpacing: "0.09em" }}
        >
          Passenger account
        </p>
        <h1 className="font-display mb-1 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Sign up
        </h1>
        <p className="mb-7 text-sm" style={{ color: "var(--text-muted)" }}>
          Create an account to book trips and manage travel cards.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              required
            />
            {errors.first_name && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.first_name[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              required
            />
            {errors.last_name && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.last_name[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
            {errors.email && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.email[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="phone_number">Phone number</Label>
            <Input
              id="phone_number"
              value={form.phone_number}
              onChange={(e) => handleChange("phone_number", e.target.value)}
              required
            />
            {errors.phone_number && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.phone_number[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.password[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <Input
              id="password_confirmation"
              type="password"
              value={form.password_confirmation}
              onChange={(e) => handleChange("password_confirmation", e.target.value)}
              required
            />
          </div>
          {generalError && (
            <p className="text-sm" style={{ color: "var(--critical)" }}>
              {generalError}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creating account…" : "Sign up"}
          </Button>
        </form>

        <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
