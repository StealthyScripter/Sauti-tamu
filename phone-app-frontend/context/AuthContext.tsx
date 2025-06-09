import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  sendVerificationCode: (phoneNumber: string) => Promise<any>;
  login: (phoneNumber: string, verificationCode: string, displayName?: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = !!(user && token && isInitialized);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      console.log('🔍 Loading stored auth data...');
      setIsLoading(true);
      
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('user')
      ]);
      
      if (storedToken && storedUser) {
        console.log('✅ Found stored auth data');
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        apiService.setAuthToken(storedToken);
      } else {
        console.log('ℹ️ No stored auth data found');
      }
    } catch (error) {
      console.error('❌ Error loading stored auth:', error);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
      console.log('✅ Auth initialization complete');
    }
  };

  const sendVerificationCode = async (phoneNumber: string) => {
    try {
      console.log('📱 Sending verification code to:', phoneNumber);
      const response = await apiService.sendVerificationCode(phoneNumber);
      console.log('✅ Verification code response:', response);
      return response;
    } catch (error) {
      console.error('❌ Verification code error:', error);
      throw error;
    }
  };

  const login = async (phoneNumber: string, verificationCode: string, displayName?: string) => {
    try {
      console.log('🔐 Logging in with:', phoneNumber, verificationCode);
      const response = await apiService.login(phoneNumber, verificationCode, displayName);
      
      if (response.success) {
        const { user: userData, token: authToken } = response.data;
        
        console.log('✅ Login successful:', userData);
        
        // Store auth data
        await Promise.all([
          AsyncStorage.setItem('authToken', authToken),
          AsyncStorage.setItem('user', JSON.stringify(userData))
        ]);
        
        // Update state
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
      console.log('🚪 Logging out...');
      
      // Clear stored data
      await Promise.all([
        AsyncStorage.removeItem('authToken'),
        AsyncStorage.removeItem('user')
      ]);
      
      // Clear state
      setToken(null);
      setUser(null);
      apiService.clearAuthToken();
      
      // Optional: notify backend
      try {
        await apiService.logout();
      } catch (logoutError) {
        // Ignore logout errors, user is logged out locally
        console.log('ℹ️ Backend logout failed, but user logged out locally');
      }
      
      console.log('✅ Logout complete');
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