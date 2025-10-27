import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import { VegModeProvider } from './context/VegModeContext';
import { CafeProvider } from './context/CafeContext';
import { RestaurantProvider } from './context/RestaurantContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import CategoryMenu from './pages/CategoryMenu';
import OrderTracking from './pages/OrderTracking';
import SingleOrderTracking from './pages/SingleOrderTracking';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminAnalytics from './pages/admin/AdminAnalytics';
  import RestaurantMenu from './pages/admin/RestaurantMenu';
  import RestaurantAnalytics from './pages/admin/RestaurantAnalytics';
import RestaurantOrders from './pages/admin/RestaurantOrders';
import AdminDeliveredOrders from './pages/admin/AdminDeliveredOrders';
import { HomePageSkeleton } from './components/SkeletonLoader';
import AdminNavigation from './components/AdminNavigation';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <LocationProvider>
          <VegModeProvider>
            <CafeProvider>
              <RestaurantProvider>
                <Router>
                  <AppRoutes />
                </Router>
              </RestaurantProvider>
            </CafeProvider>
          </VegModeProvider>
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

// Route components that have access to AuthProvider context
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading only once on app start
  if (loading) {
    return <HomePageSkeleton />;
  }

  // Protected Route Component - simplified since backend handles auth
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  // Admin Route Component - check admin status
  const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    // Check if user is admin
    const isAdmin = user.isAdmin === true;
    if (!isAdmin) {
      return <Navigate to="/" />;
    }
    
    return <>{children}</>;
  };

  // Public Route Component (redirect to home if logged in)
  const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // If user is logged in, redirect to home
    return user ? <Navigate to="/" /> : <>{children}</>;
  };

          return (
            <div className="App">
              <AdminNavigation />
              <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } />
        
        {/* User Routes - All protected */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/cafe/:restoId" element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/restaurant/:id" element={
          <ProtectedRoute>
            <Layout>
              <Restaurant />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute>
            <Layout>
              <Cart />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/cart/:restoId" element={
          <ProtectedRoute>
            <Layout>
              <Cart />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/wallet" element={
          <ProtectedRoute>
            <Wallet />
          </ProtectedRoute>
        } />
        <Route path="/track-orders" element={
          <ProtectedRoute>
            <OrderTracking />
          </ProtectedRoute>
        } />
        <Route path="/track-order/:orderId" element={
          <ProtectedRoute>
            <SingleOrderTracking />
          </ProtectedRoute>
        } />
        <Route path="/category/:category/:userId" element={
          <ProtectedRoute>
            <CategoryMenu />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/restaurants" element={
          <AdminRoute>
            <AdminRestaurants />
          </AdminRoute>
        } />
        {/* /admin/orders removed */}
                <Route path="/admin/analytics" element={
                  <AdminRoute>
                    <AdminAnalytics />
                  </AdminRoute>
                } />
                <Route path="/admin/restaurants/:restaurantId/orders" element={
                  <AdminRoute>
                    <RestaurantOrders />
                  </AdminRoute>
                } />
                <Route path="/admin/restaurants/:restaurantId/menu" element={
                  <AdminRoute>
                    <RestaurantMenu />
                  </AdminRoute>
                } />
                <Route path="/admin/restaurants/:restaurantId/analytics" element={
                  <AdminRoute>
                    <RestaurantAnalytics />
                  </AdminRoute>
                } />
                <Route path="/admin/delivered-orders" element={
                  <AdminRoute>
                    <AdminDeliveredOrders />
                  </AdminRoute>
                } />
        
        {/* Catch all route - redirect to login if not authenticated */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App;