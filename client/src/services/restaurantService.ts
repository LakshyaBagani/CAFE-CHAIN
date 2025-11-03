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
  dailyStats?: {
    orderCount: number;
    totalRevenue: number;
    date: string;
  };
}

class RestaurantService {
  private static instance: RestaurantService;
  private restaurants: Restaurant[] = [];

  private constructor() {}

  static getInstance(): RestaurantService {
    if (!RestaurantService.instance) {
      RestaurantService.instance = new RestaurantService();
    }
    return RestaurantService.instance;
  }

  async getRestaurants(): Promise<Restaurant[]> {
    try {
      const response = await axios.get('https://cafe-chain.onrender.com/admin/allResto');
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
          rating: 0,
          isActive: resto.open || false,
          dailyStats: resto.dailyStats // Include daily stats from backend
        }));
        
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
}

export default RestaurantService;
