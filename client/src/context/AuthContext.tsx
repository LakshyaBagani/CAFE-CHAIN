import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type { ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  number: string;
  isVerify: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, number: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Only check authentication once on app start
    if (authChecked) return;

    const checkAuth = async () => {
      try {
        // Validate session using backend since JWT is httpOnly and not readable via document.cookie
        const resp = await axios.get('https://cafe-chain.onrender.com/user/userInfo', { withCredentials: true });
        if (resp.data?.success && resp.data?.user) {
          setUser(resp.data.user);
          localStorage.setItem('auth_user', JSON.stringify(resp.data.user));
          localStorage.setItem('auth_user_ts', Date.now().toString());
        } else {
          setUser(null);
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_user_ts');
        }
      } catch (error: any) {
        // If unauthorized, clear; for network errors, fall back to cached user
        if (error?.response?.status === 401) {
          setUser(null);
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_user_ts');
          localStorage.removeItem('admin_cookie');
        } else {
          const cachedUser = localStorage.getItem('auth_user') || localStorage.getItem('user');
          if (cachedUser) {
            try {
              const userData = JSON.parse(cachedUser);
              setUser(userData);
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [authChecked]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('https://cafe-chain.onrender.com/auth/login', { email, password }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });

      const data = response.data;
      
      if (data.success) {
        // Check if admin login
        if (data.message === 'Admin') {
          const adminUser = {
            id: 0,
            name: 'Admin',
            email: email,
            number: '9876543210',
            isVerify: true,
            isAdmin: true
          };
          setUser(adminUser);
          // Cache admin user and admin cookie for reload persistence
          localStorage.setItem('auth_user', JSON.stringify(adminUser));
          localStorage.setItem('auth_user_ts', Date.now().toString());
          localStorage.setItem('admin_cookie', 'jwt=admin_token'); // Store admin cookie indicator
          return;
        }

        // For regular users, fetch user info
        const userResponse = await axios.get('https://cafe-chain.onrender.com/user/userInfo', {
          withCredentials: true
        });
        
        if (userResponse.data.success) {
          const userData = userResponse.data.user;
          setUser(userData);
          localStorage.setItem('auth_user', JSON.stringify(userData));
          localStorage.setItem('auth_user_ts', Date.now().toString());
        } else {
          throw new Error('Failed to fetch user info after login');
        }
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, number: string) => {
    try {
      const response = await axios.post('https://cafe-chain.onrender.com/auth/signup', { name, email, password, number }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });

      const data = response.data;
      // Don't set user immediately, let them verify email first
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post('https://cafe-chain.onrender.com/auth/logout', {}, {
        withCredentials: true
      });
      setUser(null);
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_user_ts');
      localStorage.removeItem('admin_cookie');
    } catch (error) {
      // Even if backend logout fails, clear local state
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
