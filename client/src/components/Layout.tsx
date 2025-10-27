import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation as useLocationContext } from '../context/LocationContext';
import { useCafe } from '../context/CafeContext';
import { useVegMode } from '../context/VegModeContext';
import { 
  Coffee, 
  Home, 
  ShoppingCart, 
  User, 
  Search,
  Settings,
  MapPin,
  Wallet,
  Mic,
  ChevronDown,
  Star,
  TrendingUp
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { vegMode, setVegMode } = useVegMode();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [locations, setLocations] = useState<{id: number, name: string, location: string}[]>([]);
  const { selectedLocation, setSelectedLocation } = useLocationContext();
  const { setSelectedCafe, setUserHasSelectedCafe, userHasSelectedCafe, isInitialized } = useCafe();
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const { getTotalItems, setCurrentRestaurant } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();


  useEffect(() => {
    // Only fetch locations after user is logged in
    if (loading) return;
    if (!user) return;
    fetchLocations();
  }, [user, loading]);

  // Update URL when selectedLocation changes (including from localStorage)
  useEffect(() => {
    if (selectedLocation && (location.pathname === '/' || location.pathname.startsWith('/cafe/'))) {
      const currentRestoId = location.pathname.split('/cafe/')[1];
      if (currentRestoId !== selectedLocation.id.toString()) {
        navigate(`/cafe/${selectedLocation.id}`, { replace: true });
      }
    }
  }, [selectedLocation, location.pathname, navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isLocationDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('.location-dropdown-container')) {
          setIsLocationDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLocationDropdownOpen]);

  const fetchLocations = async () => {
    try {
      // Always fetch fresh data on reload - no caching
      const response = await fetch('https://cafe-chain.onrender.com/admin/allResto');
      const data = await response.json();
      
      if (data.success && data.resto) {
        const locationData = data.resto.map((resto: any) => ({
          id: resto.id,
          name: resto.name,
          location: resto.location
        }));
        setLocations(locationData);
        
        // Get previously selected location from localStorage
        const savedLocation = localStorage.getItem('selectedLocation');
        if (savedLocation) {
          try {
            const parsedLocation = JSON.parse(savedLocation);
            // Check if the saved location still exists in the fresh data
            const locationExists = locationData.find(loc => loc.id === parsedLocation.id);
            if (locationExists) {
              setSelectedLocation(locationExists);
              return;
            }
          } catch (error) {
            console.error('Failed to parse saved location:', error);
          }
        }
        
        // Only set first location if no previously selected location or it doesn't exist anymore
        if (isInitialized && locationData.length > 0 && !selectedLocation && !userHasSelectedCafe) {
          setSelectedLocation(locationData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching locations in Layout:', error);
    }
  };

  const handleLocationSelect = (selectedLocation: {id: number, name: string, location: string}) => {
    setSelectedLocation(selectedLocation);
    setSelectedCafe(selectedLocation);
    setUserHasSelectedCafe(true); // Mark that user has explicitly selected a location
    // Save selected location to localStorage for persistence across reloads
    localStorage.setItem('selectedLocation', JSON.stringify(selectedLocation));
    setCurrentRestaurant(selectedLocation.id); // Set current restaurant for cart management
    setIsLocationDropdownOpen(false);
    
    // Navigate to cafe-specific URL
    if (location.pathname === '/' || location.pathname.startsWith('/cafe/')) {
      navigate(`/cafe/${selectedLocation.id}`);
    }
    
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }

          .sidebar-link {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }

          .sidebar-link::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 4px;
            background: linear-gradient(to bottom, #f59e0b, #ea580c);
            transform: scaleY(0);
            transition: transform 0.3s ease;
          }

          .sidebar-link:hover::before,
          .sidebar-link.active::before {
            transform: scaleY(1);
          }

          .sidebar-link:hover {
            transform: translateX(4px);
          }

          .admin-content {
            animation: fadeIn 0.5s ease;
          }

          .logo-glow {
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
          }
        `}</style>

        <div className="hidden lg:flex lg:flex-shrink-0 fixed left-0 top-0 h-full z-40">
          <div className="flex flex-col w-72">
            <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-xl">
              <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-6 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-2xl flex items-center justify-center logo-glow transform hover:scale-110 transition-transform duration-300">
                      <Coffee className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        CafeChain
                      </span>
                      <div className="text-xs text-gray-500 font-medium">Admin Portal</div>
                    </div>
                  </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                  <Link
                    to="/admin"
                    className={`sidebar-link ${
                      location.pathname === '/admin'
                        ? 'active bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl`}
                  >
                    <Home className="mr-4 h-5 w-5" />
                    <span>Dashboard</span>
                    {location.pathname === '/admin' && (
                      <TrendingUp className="ml-auto h-4 w-4 text-orange-500" />
                    )}
                  </Link>

                  <Link
                    to="/admin/restaurants"
                    className={`sidebar-link ${
                      location.pathname === '/admin/restaurants'
                        ? 'active bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl`}
                  >
                    <Coffee className="mr-4 h-5 w-5" />
                    <span>Restaurants</span>
                    <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">24</span>
                  </Link>

                  {/* Admin Orders link removed */}

                  <Link
                    to="/admin/analytics"
                    className={`sidebar-link ${
                      location.pathname === '/admin/analytics'
                        ? 'active bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl`}
                  >
                    <Settings className="mr-4 h-5 w-5" />
                    <span>Analytics</span>
                  </Link>
                </nav>

                <div className="px-4 mt-6">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
                    <Star className="h-8 w-8 mb-2" />
                    <h3 className="font-bold mb-1">Premium Features</h3>
                    <p className="text-xs opacity-90 mb-3">Upgrade to access advanced analytics</p>
                    <button className="w-full bg-white text-orange-600 text-sm font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:pl-72 flex flex-col min-h-screen">
          <main className="flex-1 admin-content">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <style>{`
         @keyframes slideDown {
           from {
             opacity: 0;
             transform: translateY(-20px);
           }
           to {
             opacity: 1;
             transform: translateY(0);
           }
         }

         @keyframes scaleIn {
           from {
             opacity: 0;
             transform: scale(0.8);
           }
           to {
             opacity: 1;
             transform: scale(1);
           }
         }

         @keyframes shimmer {
           0% {
             background-position: -1000px 0;
           }
           100% {
             background-position: 1000px 0;
           }
         }

         @keyframes subtleGlow {
           0%, 100% {
             box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
           }
           50% {
             box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
           }
         }

         @keyframes gentleFloat {
           0%, 100% { transform: translateY(0px); }
           50% { transform: translateY(-3px); }
         }

         @keyframes softPulse {
           0%, 100% { 
             transform: scale(1);
             opacity: 0.8;
           }
           50% { 
             transform: scale(1.02);
             opacity: 1;
           }
         }

         .search-input {
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
           background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fef3c7 100%);
           border: 2px solid rgba(245, 158, 11, 0.3);
           background-clip: padding-box;
           box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
         }

         .search-input:focus {
           transform: translateY(-2px);
           box-shadow: 0 8px 25px rgba(245, 158, 11, 0.25), 0 0 0 3px rgba(245, 158, 11, 0.1);
           background: linear-gradient(135deg, #fed7aa 0%, #fef3c7 100%);
           border-color: rgba(245, 158, 11, 0.5);
         }

         .search-input:hover {
           transform: translateY(-1px);
           box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
           border-color: rgba(245, 158, 11, 0.4);
           background: linear-gradient(135deg, #fed7aa 0%, #fef3c7 100%);
         }

        .veg-toggle {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .veg-toggle:active {
          transform: scale(0.95);
        }

        .veg-toggle:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

         .cart-float {
           animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
           box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
           background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
           position: relative;
         }

         .cart-float:hover {
           box-shadow: 0 12px 35px rgba(245, 158, 11, 0.4);
           transform: translateY(-3px) translateX(-50%);
           animation: subtleGlow 2s ease-in-out infinite;
         }

         .delivery-bar {
           animation: slideDown 0.6s ease;
           background: linear-gradient(135deg, #f97316 0%, #ea580c 25%, #f59e0b 75%, #d97706 100%);
           box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1);
           position: relative;
           overflow: hidden;
           border-bottom: 1px solid rgba(255, 255, 255, 0.2);
         }

         .delivery-bar::before {
           content: '';
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           bottom: 0;
           background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%);
           animation: shimmer 6s infinite;
         }

        .location-badge {
          backdrop-filter: blur(15px);
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 6px 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .location-badge:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05) translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .location-dropdown {
          animation: slideDown 0.3s ease-out;
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .profile-avatar {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .profile-avatar:hover {
          transform: translateY(-2px) scale(1.05);
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .wallet-icon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .wallet-icon:hover {
          transform: translateY(-2px) scale(1.05);
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .search-container {
          position: relative;
        }

        .search-container::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 0;
          right: 0;
          height: 10px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.03), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .search-container.focused::after {
          opacity: 1;
        }

        .badge-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .cart-icon {
          animation: float 3s ease-in-out infinite;
        }

         .gradient-text {
           background: linear-gradient(135deg, #ea580c 0%, #f59e0b 50%, #fbbf24 100%);
           -webkit-background-clip: text;
           -webkit-text-fill-color: transparent;
           background-clip: text;
         }
      `}</style>

      <div className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-orange-100/50">
        <div className="delivery-bar text-white px-4 py-3 lg:py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 lg:space-x-3">
                <div className="relative location-dropdown-container">
                  <button 
                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    className="location-badge flex items-center space-x-1.5 cursor-pointer group"
                  >
                    <MapPin className="h-3.5 w-3.5 group-hover:animate-bounce" />
                    <span className="text-xs font-medium">
                      {selectedLocation ? selectedLocation.location : 'Select Location'}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 group-hover:rotate-180 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Location Dropdown */}
                  {isLocationDropdownOpen && (
                    <div className="location-dropdown fixed top-20 left-4 w-64 bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/30 z-[99999] overflow-hidden">
                      <div className="p-3">
                        <div className="text-sm font-bold text-gray-700 px-3 py-3 border-b border-gray-200/60 bg-white/60 rounded-t-lg">
                          🏪 Select Cafe Location
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {locations.map((location) => (
                            <button
                              key={location.id}
                              onClick={() => handleLocationSelect(location)}
                              className={`w-full text-left px-4 py-4 text-sm hover:bg-amber-50/90 transition-all duration-200 rounded-lg border-b border-gray-100/40 last:border-b-0 ${
                                selectedLocation?.id === location.id ? 'bg-amber-100/90 text-amber-800 font-semibold shadow-sm' : 'text-gray-700 hover:text-amber-700'
                              }`}
                            >
                              <div className="font-semibold flex items-center space-x-3">
                                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                  <MapPin className="h-4 w-4 text-amber-600" />
                                </div>
                                <span className="text-base">{location.name}</span>
                              </div>
                              <div className="text-sm text-gray-600 mt-2 ml-11 font-medium">{location.location}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3 lg:space-x-2">
                <Link to="/wallet" className="wallet-icon">
                  <Wallet className="h-6 w-6 text-white drop-shadow-lg" />
                </Link>
                <Link to="/profile" className="profile-avatar">
                  <User className="h-6 w-6 text-white drop-shadow-lg" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Hide search bar and veg mode on cart page */}
        {!location.pathname.startsWith('/cart') && (
          <div className="px-4 py-4 bg-gradient-to-b from-white via-orange-50/30 to-white border-b border-orange-100/50 shadow-sm">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center space-x-4">
                <div className={`search-container flex-1 ${isSearchFocused ? 'focused' : ''}`}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search for cuisines, dishes, restaurants..."
                      className="search-input w-full pl-12 pr-12 py-3.5 lg:py-2.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm bg-gray-50 focus:bg-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                    />
                    <button className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform">
                      <Mic className="h-5 w-5 text-amber-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl px-4 py-2.5 lg:px-3 lg:py-2 border border-amber-300 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-700">
                      VEG MODE
                    </span>
                  </div>
                  <button
                    onClick={() => setVegMode(!vegMode)}
                    className={`veg-toggle relative inline-flex h-7 w-12 items-center rounded-full transition-colors shadow-inner ${
                      vegMode ? 'bg-amber-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                        vegMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="flex-1 pb-32">
        {children}
      </main>

      {/* Hide floating cart on cart page */}
      {!location.pathname.startsWith('/cart') && (
        <div className="lg:hidden fixed bottom-6 left-1/2 z-50" style={{ transform: 'translateX(-50%)' }}>
          <Link
            to={selectedLocation ? `/cart/${selectedLocation.id}` : "/cart"}
            className="cart-float flex items-center space-x-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 rounded-full transition-all duration-300"
          >
            <div className="relative cart-icon">
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 bg-yellow-400 text-orange-900 text-xs rounded-full flex items-center justify-center font-bold shadow-lg badge-pulse">
                  {getTotalItems()}
                </span>
              )}
            </div>
            <div className="text-left">
              <div className="text-base font-bold">View Cart</div>
              <div className="text-xs opacity-95 font-medium">
                {getTotalItems() > 0 ? `${getTotalItems()} item${getTotalItems() > 1 ? 's' : ''} added` : 'Add items'}
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Layout;