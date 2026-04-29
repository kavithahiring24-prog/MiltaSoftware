import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearAuth,
  getCurrentUser,
  getStoredToken,
  getStoredUser,
  login,
  subscribeToAuthChanges,
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (!getStoredToken()) {
        if (active) setIsBootstrapping(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (active) {
          setUser(currentUser);
          setToken(getStoredToken());
        }
      } catch (_error) {
        clearAuth();
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setIsBootstrapping(false);
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return subscribeToAuthChanges(() => {
      setToken(getStoredToken());
      setUser(getStoredUser());
    });
  }, []);

  const loginUser = async (payload) => {
    const response = await login(payload);
    setToken(response.token);
    setUser(response.user);
    return response;
  };

  const logoutUser = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setToken(getStoredToken());
    return currentUser;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isBootstrapping,
      loginUser,
      logoutUser,
      refreshUser,
      setUser,
    }),
    [token, user, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
