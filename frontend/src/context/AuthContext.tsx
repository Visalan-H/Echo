import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import api, { getApiErrorMessage } from "../utils/api";
import type { UserProfile } from "../types/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: UserProfile | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  authError: string | null;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      setAuthError(null);
      const { data } = await api.get<UserProfile>("/api/auth/me");
      setUser(data);
      setStatus("authenticated");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      setUser(null);
      setStatus("unauthenticated");
      setAuthError(getApiErrorMessage(error, "Unable to verify your session."));
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const loginWithGoogle = useCallback(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    window.location.assign(`${apiBaseUrl}/api/auth/google/url`);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    }

    setUser(null);
    setStatus("unauthenticated");
    setAuthError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      authError,
      loginWithGoogle,
      logout,
      refreshUser,
    }),
    [user, status, authError, loginWithGoogle, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
