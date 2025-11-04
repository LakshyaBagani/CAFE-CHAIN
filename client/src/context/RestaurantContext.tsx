import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
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
  getCachedCategoryMenu: (restaurantId: number, category: string) => MenuItem[] | null;
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
  // Load from localStorage on mount to persist across refreshes
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    try {
      const cached = localStorage.getItem('restaurants_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is less than 5 minutes old
        const cacheTime = localStorage.getItem('restaurants_cache_time');
        if (cacheTime && Date.now() - parseInt(cacheTime) < 5 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load restaurants from cache:', e);
    }
    return [];
  });
  const [restaurantStatus, setRestaurantStatus] = useState<{ [restaurantId: number]: { isOpen: boolean; message?: string } }>({});
  const [loading, setLoading] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    // If we already have restaurants, skip fetch
    if (restaurants.length > 0 && !loading) {
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
        // Cache in localStorage
        try {
          localStorage.setItem('restaurants_cache', JSON.stringify(restaurantData));
          localStorage.setItem('restaurants_cache_time', Date.now().toString());
        } catch (e) {
          console.error('Failed to cache restaurants:', e);
        }
        console.log(`[PERF] Restaurants processed in: ${Date.now() - startTime}ms total`);
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      console.log(`[PERF] Restaurants fetch failed after: ${Date.now() - startTime}ms`);
    } finally {
      setLoading(false);
    }
  }, [restaurants.length, loading]);

  // Remove auto-fetch - let components fetch when needed

  const fetchMenu = async (restaurantId: number): Promise<MenuItem[]> => {
    const startTime = Date.now();

    const CACHE_KEY = `menu_cache_${restaurantId}`;
    const CACHE_BYCAT_KEY = `menu_cache_bycat_${restaurantId}`;
    const VERSION_KEY = `menu_version_${restaurantId}`;

    const normalizeCategory = (c: string): string => {
      const key = (c || '').trim().toLowerCase();
      if (key.startsWith('roll')) return 'Roll';
      if (key.startsWith('burger')) return 'Burger';
      if (key.startsWith('sand')) return 'Sandwich';
      if (key.startsWith('ome')) return 'Omelette';
      if (key.startsWith('mag') || key.startsWith('maggi')) return 'Maggie';
      if (key.startsWith('mock')) return 'Mocktail';
      if (key.startsWith('fri')) return 'Fries';
      if (key.startsWith('drink')) return 'Drinks';
      return c;
    };

    const mapApiToMenu = (data: any): MenuItem[] => {
      const items: MenuItem[] = (data.menu || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        imageUrl: item.imageUrl,
        veg: item.veg,
        category: item.category,
        availability: item.availability
      }));
      items.sort((a: any, b: any) => {
        const avA = a.availability !== false;
        const avB = b.availability !== false;
        return Number(avB) - Number(avA);
      });
      return items;
    };

    const setOpenStatus = (isOpen: boolean, message?: string) => {
      setRestaurantStatus(prev => ({
        ...prev,
        [restaurantId]: { isOpen, message }
      }));
      console.log(`[MENU] Status for resto ${restaurantId}:`, { isOpen, message });
    };

    // 1) Serve cached menu immediately if available
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const cached: MenuItem[] = JSON.parse(cachedRaw);
        // Ensure by-category cache exists
        try {
          const byCatRaw = localStorage.getItem(CACHE_BYCAT_KEY);
          if (!byCatRaw) {
            const byCat: Record<string, MenuItem[]> = {};
            cached.forEach((it) => {
              const cat = normalizeCategory(it.category);
              (byCat[cat] ||= []).push(it);
            });
            localStorage.setItem(CACHE_BYCAT_KEY, JSON.stringify(byCat));
          }
        } catch {}
        console.log(`[MENU] Using cached menu for resto ${restaurantId} with`, cached.length, 'items');
        // Kick off a background version check and potential refresh
        (async () => {
          try {
            console.log(`[MENU] Checking menu version for resto ${restaurantId}...`);
            const vResp = await axios.get(`https://cafe-chain.onrender.com/admin/resto/${restaurantId}/getMenuVersion`, { withCredentials: true });
            const latest = vResp?.data?.menuVersion != null ? String(vResp.data.menuVersion) : null;
            const storedVersion = localStorage.getItem(VERSION_KEY);
            console.log(`[MENU] Version result for resto ${restaurantId}:`, { latest, storedVersion });
            if (!storedVersion || (latest && latest !== storedVersion)) {
              console.log(`[MENU] Version changed for resto ${restaurantId}. Refreshing menu...`);
              const response = await axios.get(`https://cafe-chain.onrender.com/user/resto/${restaurantId}/menu`, { withCredentials: true });
              const data = response.data;
              if (data.success && data.message !== "Resto is closed") {
                const items = mapApiToMenu(data);
                localStorage.setItem(CACHE_KEY, JSON.stringify(items));
                // Update by-category cache
                try {
                  const byCat: Record<string, MenuItem[]> = {};
                  items.forEach((it) => {
                    const cat = normalizeCategory(it.category);
                    (byCat[cat] ||= []).push(it);
                  });
                  localStorage.setItem(CACHE_BYCAT_KEY, JSON.stringify(byCat));
                } catch {}
                if (latest) localStorage.setItem(VERSION_KEY, latest);
                setOpenStatus(true);
                console.log(`[MENU] Menu refreshed for resto ${restaurantId}. Items:`, items.length);
              }
            }
          } catch (err) {
            console.warn('[MENU] Menu version check failed', err);
          }
        })();

        // assume open if we have a cached menu
        setOpenStatus(true);
        return cached;
      }
    } catch {}

    // 2) No cache → fetch live and persist
    try {
      console.log(`[MENU] No cache. Fetching menu for restaurant ${restaurantId}...`);
      const response = await axios.get(`https://cafe-chain.onrender.com/user/resto/${restaurantId}/menu`, {
        withCredentials: true
      });
      console.log(`[PERF] Menu API call took: ${Date.now() - startTime}ms`);
      const data = response.data;
      if (data.success) {
        if (data.message === "Resto is closed") {
          setOpenStatus(false, "Restaurant is closed");
          return [];
        }
        const items = mapApiToMenu(data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(items));
          // Also store by-category cache
          const byCat: Record<string, MenuItem[]> = {};
          items.forEach((it) => {
            const cat = normalizeCategory(it.category);
            (byCat[cat] ||= []).push(it);
          });
          localStorage.setItem(CACHE_BYCAT_KEY, JSON.stringify(byCat));
        } catch {}
        // fetch and store version after data
        try {
          console.log(`[MENU] Fetching version after data for resto ${restaurantId}...`);
          const vResp = await axios.get(`https://cafe-chain.onrender.com/admin/resto/${restaurantId}/getMenuVersion`, { withCredentials: true });
          const latest = vResp?.data?.menuVersion;
          if (latest !== undefined && latest !== null) {
            localStorage.setItem(VERSION_KEY, String(latest));
            console.log(`[MENU] Stored version ${latest} for resto ${restaurantId}`);
          }
        } catch {}
        setOpenStatus(true);
        console.log(`[MENU] Menu fetched for resto ${restaurantId}. Items:`, items.length);
        return items;
      }
      setOpenStatus(false, data.message || "Menu not available");
      return [];
    } catch (error) {
      console.error(`[MENU] Failed to fetch menu for restaurant ${restaurantId}:`, error);
      setOpenStatus(false, "Failed to load menu");
      return [];
    }
  };

  const getCachedCategoryMenu = (restaurantId: number, category: string): MenuItem[] | null => {
    try {
      const byCatRaw = localStorage.getItem(`menu_cache_bycat_${restaurantId}`);
      if (!byCatRaw) return null;
      const byCat = JSON.parse(byCatRaw) as Record<string, MenuItem[]>;
      // Normalize requested category same way
      const norm = ((): string => {
        const c = (category || '').trim().toLowerCase();
        if (c.startsWith('roll')) return 'Roll';
        if (c.startsWith('burger')) return 'Burger';
        if (c.startsWith('sand')) return 'Sandwich';
        if (c.startsWith('ome')) return 'Omelette';
        if (c.startsWith('mag') || c.startsWith('maggi')) return 'Maggie';
        if (c.startsWith('mock')) return 'Mocktail';
        if (c.startsWith('fri')) return 'Fries';
        if (c.startsWith('drink')) return 'Drinks';
        return category;
      })();
      return byCat[norm] || null;
    } catch {
      return null;
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
    getRestaurantStatus,
    getCachedCategoryMenu
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};
