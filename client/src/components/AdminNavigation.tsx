import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminNavigation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate to admin panel if user is admin and we're not already on admin routes
    if (user && user.isAdmin && !window.location.pathname.startsWith('/admin')) {
      navigate('/admin');
    }
  }, [user, navigate]);

  return null; // This component doesn't render anything
};

export default AdminNavigation;
