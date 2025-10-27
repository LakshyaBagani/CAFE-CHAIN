import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import axios from 'axios';

interface Restaurant {
  id: number;
  name: string;
  location: string;
  open: boolean;
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  veg: boolean;
  category: string;
  availability?: boolean;
}

interface RestaurantContextType {
  restaurants: Restaurant[];
  restaurantStatus: { [restaurantId: number]: { isOpen: boolean; message?: string } };
  loading: boolean;
  fetchRestaurants: () => Promise<void>;
  fetchMenu: (restaurantId: number) => Promise<MenuItem[]>;
  getRestaurantStatus: (restaurantId: number) => { isOpen: boolean; message?: string };
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

interface RestaurantProviderProps {
  children: ReactNode;
}

export const RestaurantProvider: React.FC<RestaurantProviderProps> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantStatus, setRestaurantStatus] = useState<{ [restaurantId: number]: { isOpen: boolean; message?: string } }>({});
  const [loading, setLoading] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    if (restaurants.length > 0) {
      console.log('Restaurants already loaded, skipping fetch');
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      console.log('Fetching restaurants data...');
      const response = await axios.get('https://cafe-chain.onrender.com/user/restaurants');
      const data = response.data;
      
      console.log(`[PERF] Restaurants API call took: ${Date.now() - startTime}ms`);
      
      if (data.success && data.restaurants) {
        const restaurantData = data.restaurants.map((resto: any) => ({
          id: resto.id,
          name: resto.name,
          location: resto.location,
          open: resto.open
        }));
        setRestaurants(restaurantData);
        console.log(`[PERF] Restaurants processed in: ${Date.now() - startTime}ms total`);
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      console.log(`[PERF] Restaurants fetch failed after: ${Date.now() - startTime}ms`);
    } finally {
      setLoading(false);
    }
  }, [restaurants.length]);

  // Auto-fetch restaurants on mount
  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const fetchMenu = async (restaurantId: number): Promise<MenuItem[]> => {
    const startTime = Date.now();

    try {
      console.log(`Fetching fresh menu for restaurant ${restaurantId}...`);
      const response = await axios.get(`https://cafe-chain.onrender.com/user/resto/${restaurantId}/menu`, {
        withCredentials: true
      });
      
      console.log(`[PERF] Menu API call took: ${Date.now() - startTime}ms`);
      
      const data = response.data;
      if (data.success) {
        // Check if restaurant is closed
        if (data.message === "Resto is closed") {
          console.log(`Restaurant ${restaurantId} is CLOSED`);
          const emptyMenu: MenuItem[] = [];
          setRestaurantStatus(prev => ({
            ...prev,
            [restaurantId]: { isOpen: false, message: "Restaurant is closed" }
          }));
          return emptyMenu;
        }

        // Restaurant is open, process menu items
        const menuItems = data.menu.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          imageUrl: item.imageUrl,
          veg: item.veg,
          category: item.category,
          availability: item.availability
        }));

        // Sort by availability (available first)
        menuItems.sort((a: any, b: any) => {
          const avA = a.availability !== false;
          const avB = b.availability !== false;
          return Number(avB) - Number(avA);
        });

        // Mark restaurant as open
        setRestaurantStatus(prev => ({
          ...prev,
          [restaurantId]: { isOpen: true }
        }));

        console.log(`[PERF] Menu processed in: ${Date.now() - startTime}ms total for ${menuItems.length} items`);
        return menuItems;
      } else {
        console.log(`Menu fetch failed for restaurant ${restaurantId}:`, data.message);
        const emptyMenu: MenuItem[] = [];
        setRestaurantStatus(prev => ({
          ...prev,
          [restaurantId]: { isOpen: false, message: data.message || "Menu not available" }
        }));
        return emptyMenu;
      }
    } catch (error) {
      console.error(`Failed to fetch menu for restaurant ${restaurantId}:`, error);
      const emptyMenu: MenuItem[] = [];
      setRestaurantStatus(prev => ({
        ...prev,
        [restaurantId]: { isOpen: false, message: "Failed to load menu" }
      }));
      return emptyMenu;
    }
  };

  const getRestaurantStatus = (restaurantId: number): { isOpen: boolean; message?: string } => {
    return restaurantStatus[restaurantId] || { isOpen: true };
  };

  const value = {
    restaurants,
    restaurantStatus,
    loading,
    fetchRestaurants,
    fetchMenu,
    getRestaurantStatus
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};
