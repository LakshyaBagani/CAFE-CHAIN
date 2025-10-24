import axios from 'axios';

export interface Restaurant {
  id: number;
  name: string;
  location: string;
  number: string;
  createdAt: string;
  totalOrders: number;
  totalRevenue: number;
  rating: number;
  isActive: boolean;
}

class RestaurantService {
  private static instance: RestaurantService;
  private restaurants: Restaurant[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): RestaurantService {
    if (!RestaurantService.instance) {
      RestaurantService.instance = new RestaurantService();
    }
    return RestaurantService.instance;
  }

  async getRestaurants(forceRefresh: boolean = false): Promise<Restaurant[]> {
    const now = Date.now();
    
    // Return cached data if it's fresh and not forcing refresh
    if (!forceRefresh && this.restaurants.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.restaurants;
    }

    // Try localStorage cache first
    const cached = localStorage.getItem('allResto_cache');
    const cachedAt = localStorage.getItem('allResto_cache_ts');
    
    if (cached && cachedAt && !forceRefresh) {
      try {
        const cacheAge = Date.now() - parseInt(cachedAt);
        if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
          const cachedResto = JSON.parse(cached);
          this.restaurants = cachedResto.map((resto: any) => ({
            id: resto.id,
            name: resto.name,
            location: resto.location,
            number: resto.number,
            createdAt: resto.createdAt,
            totalOrders: Math.floor(Math.random() * 100) + 10,
            totalRevenue: Math.floor(Math.random() * 5000) + 1000,
            rating: 4.0 + Math.random() * 1.0,
            isActive: resto.open || false
          }));
          this.lastFetch = now;
          return this.restaurants;
        }
      } catch {}
    }

    try {
      const response = await axios.get('http://localhost:3000/admin/allResto');
      const data = response.data;
      
      if (data.success && data.resto) {
        this.restaurants = data.resto.map((resto: any) => ({
          id: resto.id,
          name: resto.name,
          location: resto.location,
          number: resto.number,
          createdAt: resto.createdAt,
          totalOrders: Math.floor(Math.random() * 100) + 10,
          totalRevenue: Math.floor(Math.random() * 5000) + 1000,
          rating: 4.0 + Math.random() * 1.0,
          isActive: resto.open || false
        }));
        this.lastFetch = now;
        
        // Cache the data
        localStorage.setItem('allResto_cache', JSON.stringify(data.resto));
        localStorage.setItem('allResto_cache_ts', Date.now().toString());
        
        return this.restaurants;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Failed to fetch restaurants:', error);
      throw error;
    }
  }

  getCachedRestaurants(): Restaurant[] {
    return this.restaurants;
  }

  clearCache(): void {
    this.restaurants = [];
    this.lastFetch = 0;
  }
}

export default RestaurantService;
