import { useState, useEffect, useCallback } from "react";
import { apiFetch, setToken, clearToken, getToken } from "../lib/api";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: validate existing token
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email, password) => {
    const data = await apiFetch("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const signUp = useCallback(async (email, password) => {
    const data = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    await apiFetch("/auth/signout", { method: "POST" }).catch(() => {});
    clearToken();
    setUser(null);
  }, []);

  return { user, loading, signIn, signUp, signOut, isLocalMode: false };
}
