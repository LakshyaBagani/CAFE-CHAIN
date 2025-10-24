import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Coffee,
  Calendar,
  Download,
  Star,
  ShoppingBag,
  ArrowLeft
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topRestaurants: Array<{
    id: number;
    name: string;
    revenue: number;
    orders: number;
    rating: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

const AdminAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  // const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      // Mock data for demo
      const mockData: AnalyticsData = {
        totalRevenue: 125000,
        totalOrders: 2500,
        averageOrderValue: 50,
        topRestaurants: [
          { id: 1, name: 'Downtown Bistro', revenue: 35000, orders: 700, rating: 4.8 },
          { id: 2, name: 'Garden Cafe', revenue: 28000, orders: 560, rating: 4.6 },
          { id: 3, name: 'Pizza Palace', revenue: 25000, orders: 500, rating: 4.5 },
          { id: 4, name: 'Sushi Corner', revenue: 22000, orders: 440, rating: 4.7 },
          { id: 5, name: 'Burger Joint', revenue: 20000, orders: 400, rating: 4.4 }
        ],
        dailyRevenue: [
          { date: '2024-01-09', revenue: 1200, orders: 24 },
          { date: '2024-01-10', revenue: 1500, orders: 30 },
          { date: '2024-01-11', revenue: 1800, orders: 36 },
          { date: '2024-01-12', revenue: 2100, orders: 42 },
          { date: '2024-01-13', revenue: 1900, orders: 38 },
          { date: '2024-01-14', revenue: 2200, orders: 44 },
          { date: '2024-01-15', revenue: 2500, orders: 50 }
        ],
        monthlyRevenue: [
          { month: 'Jan', revenue: 25000, orders: 500 },
          { month: 'Feb', revenue: 28000, orders: 560 },
          { month: 'Mar', revenue: 32000, orders: 640 },
          { month: 'Apr', revenue: 30000, orders: 600 },
          { month: 'May', revenue: 35000, orders: 700 },
          { month: 'Jun', revenue: 40000, orders: 800 }
        ]
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = (data: any[], key: string) => {
    return Math.max(...data.map(item => item[key]));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
        <p className="text-gray-500">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <a
            href="/admin"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:text-amber-600 hover:border-amber-300 transition-colors"
            aria-label="Back to Admin"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Insights and performance metrics for your restaurant chain</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalOrders.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.averageOrderValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">4.6</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Daily Revenue</h3>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Last 7 days</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {analyticsData.dailyRevenue.map((day, index) => {
              const maxRevenue = getMaxValue(analyticsData.dailyRevenue, 'revenue');
              const percentage = (day.revenue / maxRevenue) * 100;
              
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-16 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(day.revenue)}
                      </span>
                      <span className="text-sm text-gray-500">{day.orders} orders</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Restaurants</h3>
            <Coffee className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {analyticsData.topRestaurants.map((restaurant, index) => (
              <div key={restaurant.id} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-900">{restaurant.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{restaurant.orders} orders</span>
                    <span className="text-sm font-medium text-amber-600">
                      {formatCurrency(restaurant.revenue)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue Trend</h3>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">6 months</span>
          </div>
        </div>
        
        <div className="grid grid-cols-6 gap-4">
          {analyticsData.monthlyRevenue.map((month, index) => {
            const maxRevenue = getMaxValue(analyticsData.monthlyRevenue, 'revenue');
            const percentage = (month.revenue / maxRevenue) * 100;
            
            return (
              <div key={index} className="text-center">
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-lg h-32 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-amber-500 to-orange-600 rounded-lg transition-all duration-300"
                      style={{ height: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">{month.month}</div>
                <div className="text-xs text-gray-500">{formatCurrency(month.revenue)}</div>
                <div className="text-xs text-gray-400">{month.orders} orders</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Revenue increased by 15% this month</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Order volume up 12% from last month</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Peak hours: 12-2 PM and 7-9 PM</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Customer satisfaction at 4.6/5</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <Download className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 font-medium">Download Full Report</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">View Growth Metrics</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-purple-700 font-medium">Customer Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
