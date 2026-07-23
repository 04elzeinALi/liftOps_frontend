import { createContext, useContext, useEffect, useState } from "react";
import api from "@/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/user")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Keep auth state in sync across browser tabs: localStorage `storage`
  // events fire in OTHER tabs when one tab logs in/out or switches account.
  // Without this, a second tab keeps showing a stale session (and sends the
  // now-wrong token), which produced confusing "insufficient permissions"
  // errors. Re-reading the token here re-triggers the /user fetch above.
  useEffect(() => {
    function syncToken(event) {
      if (event.key !== "token") {
        return;
      }
      const next = event.newValue;
      setToken(next);
      if (!next) {
        setUser(null);
      }
    }
    window.addEventListener("storage", syncToken);
    return () => window.removeEventListener("storage", syncToken);
  }, []);

  async function login(email, password) {
    const res = await api.post("/login", { email, password });
    const { token: newToken, user: loggedInUser } = res.data.data;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function register(payload) {
    const res = await api.post("/register", payload);
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }

  async function logout() {
    try {
      await api.post("/logout");
    } catch {
      // token may already be invalid server-side — clear local state regardless
    }
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
