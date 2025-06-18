import * as React from 'react';
import { createContext, useState, useContext, ReactNode } from 'react';
import apiService from '../services/apiService';

interface User {
  id: string;
  phoneNumber: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  sendVerificationCode: (phoneNumber: string) => Promise<any>;
  login: (phoneNumber: string, verificationCode: string, displayName?: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true); // Immediately true

  const isAuthenticated = isInitialized && !!(user && token);

  // No auth loading on mount (removed AsyncStorage useEffect)

  const sendVerificationCode = async (phoneNumber: string) => {
    try {
      const response = await apiService.sendVerificationCode(phoneNumber);
      return response;
    } catch (error) {
      console.error('❌ Verification code error:', error);
      throw error;
    }
  };

  const login = async (phoneNumber: string, verificationCode: string, displayName?: string) => {
    try {
      const response = await apiService.login(phoneNumber, verificationCode, displayName);

      if (response.success) {
        const { user: userData, token: authToken } = response.data;

        setToken(authToken);
        setUser(userData);
        apiService.setAuthToken(authToken);

        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      apiService.clearAuthToken();

      try {
        await apiService.logout();
      } catch {
        console.log('ℹ️ Backend logout failed, but user logged out locally');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,
      isInitialized,
      sendVerificationCode,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
