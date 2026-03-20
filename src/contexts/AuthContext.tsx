import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthUser {
  userId: string;
  role: "BUYER" | "SELLER";
  displayName: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (data: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("artisan_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        localStorage.setItem("artisan_token", parsed.token);
      } catch {
        localStorage.removeItem("artisan_user");
      }
    }
  }, []);

  const login = useCallback((data: AuthUser) => {
    setUser(data);
    localStorage.setItem("artisan_user", JSON.stringify(data));
    localStorage.setItem("artisan_token", data.token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("artisan_user");
    localStorage.removeItem("artisan_token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
