import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type { ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  number?: string;
  isVerify?: boolean;
  isAdmin?: boolean;
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

    const checkAuth = () => {
      // Check for admin cookie first
      const adminCookie = localStorage.getItem('admin_cookie');
      if (adminCookie) {
        setUser({ id: 0, name: 'Admin', email: 'admin@cafe-chain.com', isAdmin: true });
        setLoading(false);
        setAuthChecked(true);
        return;
      }

      // Check for regular user from localStorage
      const cachedUser = localStorage.getItem('auth_user') || localStorage.getItem('user');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
        } catch (parseError) {
          console.error('Error parsing cached user:', parseError);
          setUser(null);
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_user_ts');
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
      setAuthChecked(true);
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
          
          // Show success toast
          const { showToast } = await import('../utils/toast');
          showToast('Admin login successful!', 'success');
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
          
          // Show success toast
          const { showToast } = await import('../utils/toast');
          showToast('Login successful!', 'success');
        } else {
          throw new Error('Failed to fetch user info after login');
        }
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      // Show error toast with backend message
      const { showToast } = await import('../utils/toast');
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, number: string) => {
    try {
      await axios.post('https://cafe-chain.onrender.com/auth/signup', { name, email, password, number }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });

      // Show success toast
      const { showToast } = await import('../utils/toast');
      showToast('Account created successfully! Please verify your email.', 'success');
      // Don't set user immediately, let them verify email first
    } catch (error: any) {
      // Show error toast with backend message
      const { showToast } = await import('../utils/toast');
      const errorMessage = error.response?.data?.message || error.message || 'Signup failed. Please try again.';
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  const logout = async () => {
    // Optimistically clear local auth state for immediate UI update
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_ts');
    localStorage.removeItem('admin_cookie');

    // Fire-and-forget backend logout; do not block UI/navigation
    try {
      await axios.post('https://cafe-chain.onrender.com/auth/logout', {}, { withCredentials: true });
    } catch (_) {
      // ignore network errors
    } finally {
      const { showToast } = await import('../utils/toast');
      showToast('Logged out successfully!', 'success');
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
