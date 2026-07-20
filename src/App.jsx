import { AuthProvider, useAuth } from "@/auth/AuthContext";

function Inner() {
  const { user, login, logout, loading } = useAuth();

  if (loading) return <p style={{ padding: 32 }}>loading...</p>;

  if (user) {
    return (
      <div style={{ padding: 32 }}>
        <p>Logged in as {user.name} ({user.role})</p>
        <button onClick={logout}>Log out</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <button
        onClick={() => login("marge26@example.org", "password").catch((e) => alert("login failed: " + e.message))}
      >
        Log in as seeded admin
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  );
}
