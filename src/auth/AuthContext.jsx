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

  async function login(email, password) {
    const res = await api.post("/login", { email, password });
    const { token: newToken, user: loggedInUser } = res.data.data;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(loggedInUser);
    return loggedInUser;
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
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
