import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [tokens, setTokens] = useState(null); // { access, refresh }
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const persistTokens = (jwt) => {
    try {
      localStorage.setItem('access', jwt.access);
      localStorage.setItem('refresh', jwt.refresh);
    } catch {}
  };

  const clearPersistedTokens = () => {
    try {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    } catch {}
  };

  const logout = () => {
    setTokens(null);
    setUser(null);
    clearPersistedTokens();
  };

  const refreshTokens = async (refreshToken) => {
    const res = await fetch('/api/auth/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) {
      throw new Error('Refresh failed');
    }
    const data = await res.json();
    const updated = { access: data.access, refresh: refreshToken };
    setTokens(updated);
    persistTokens(updated);
    return updated;
  };

  const apiFetch = async (url, options = {}) => {
    const opts = { ...options };
    opts.headers = {
      ...(options.headers || {}),
      ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
    };

    const doFetch = async () => fetch(url, opts);

    let res = await doFetch();
    if (res.status === 401 && tokens?.refresh) {
      try {
        const updated = await refreshTokens(tokens.refresh);
        opts.headers = {
          ...(options.headers || {}),
          Authorization: `Bearer ${updated.access}`,
        };
        res = await doFetch();
      } catch (e) {
        logout();
        throw e;
      }
    }
    return res;
  };

  const loadMe = async (accessToken) => {
    setLoadingUser(true);
    try {
      const res = await fetch('/api/auth/me/', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      setUser(data);
    } catch (e) {
      logout();
    } finally {
      setLoadingUser(false);
    }
  };

  const refreshMe = async () => {
    if (tokens?.access) {
      await loadMe(tokens.access);
    }
  };

  const login = (jwt) => {
    setTokens(jwt);
    persistTokens(jwt);
    loadMe(jwt.access);
  };

  // Restore session on mount
  useEffect(() => {
    const access = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');
    if (access && refresh && !tokens) {
      const jwt = { access, refresh };
      setTokens(jwt);
      loadMe(access);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ tokens, user, loadingUser, login, logout, apiFetch, refreshMe }),
    [tokens, user, loadingUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
