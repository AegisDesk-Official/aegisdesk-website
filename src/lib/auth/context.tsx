"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, CompanyTenant } from "@/types";
import { api } from "@/lib/api-client";
import { MOCK_USER, MOCK_TENANT } from "@/lib/db/mock-data";

interface AuthContextType {
  user: User | null;
  tenant: CompanyTenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    companyName: string;
    fullName: string;
    email: string;
    password: string;
    website?: string;
    planId?: string;
  }) => Promise<void>;
  signOut: () => void;
  refreshTenant: () => Promise<void>;
  setTenantState: (tenant: CompanyTenant) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<CompanyTenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    const initAuth = async () => {
      try {
        const storedToken = typeof window !== "undefined" ? localStorage.getItem("omni_token") : null;
        if (storedToken) {
          const res = await api.getCurrentTenant();
          setUser(res.user);
          setTenant(res.tenant);
        } else {
          // Pre-populate with default demo user in mock mode for instant dashboard accessibility
          setUser(MOCK_USER);
          setTenant(MOCK_TENANT);
          api.setToken("mock_jwt_token_sample");
          api.setTenantId(MOCK_TENANT.id);
        }
      } catch (err) {
        console.warn("Failed to load active session:", err);
        setUser(MOCK_USER);
        setTenant(MOCK_TENANT);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setUser(res.user);
      setTenant(res.tenant);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: {
    companyName: string;
    fullName: string;
    email: string;
    password: string;
    website?: string;
    planId?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.registerCompany(data);
      setUser(res.user);
      setTenant(res.tenant);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    api.setToken(null);
    api.setTenantId(null);
    setUser(null);
    setTenant(null);
  };

  const refreshTenant = async () => {
    try {
      const res = await api.getCurrentTenant();
      setUser(res.user);
      setTenant(res.tenant);
    } catch (err) {
      console.error("Failed to refresh tenant info", err);
    }
  };

  const setTenantState = (updated: CompanyTenant) => {
    setTenant(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isLoading,
        isAuthenticated: !!user && !!tenant,
        signIn,
        signUp,
        signOut,
        refreshTenant,
        setTenantState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
