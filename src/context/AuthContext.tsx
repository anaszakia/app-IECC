import React, { createContext, useContext, useState } from 'react';
import { setApiAuthToken } from '../api/client';

export type UserType = 'CITIZEN' | 'FIELD' | 'STAFF' | null;

export interface UserProfile {
  ulid: string;
  name: string;
  email: string;
  phone?: string;
  user_type: UserType;
  role?: string;
  agency?: {
    code: string;
    name: string;
    type: string;
  } | null;
  unit?: {
    id?: number;
    ulid: string;
    code: string;
    type: string;
    status: string;
    agency_id?: number;
    lat?: number;
    lng?: number;
    crew_ready?: boolean;
  } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (userData: UserProfile, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (userData: UserProfile, tokenStr: string) => {
    setUser(userData);
    setToken(tokenStr);
    setApiAuthToken(tokenStr);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setApiAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
