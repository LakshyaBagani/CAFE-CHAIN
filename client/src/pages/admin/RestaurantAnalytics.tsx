import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Activity,
  Target,
  Award,
  LineChart,
  Coffee,
  Download
} from 'lucide-react';

interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface RestaurantAnalytics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    growthRate: number;
  };
  dailySales: DailySales[];
  topSellingItems: Array<{
    id: number;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  customerMetrics: {
    newCustomers: number;
    returningCustomers: number;
    averageSessionTime: number;
    customerSatisfaction: number;
  };
}

const RestaurantAnalytics: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<RestaurantAnalytics | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [restaurantId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`https://cafe-chain.onrender.com/admin/resto/${restaurantId}/analytics`, {
        params: { period: '7d' },
        withCredentials: true
      });
      
      if (response.data.success) {
        setAnalyticsData(response.data.data);
        } else {
        console.error('API returned error:', response.data.message);
        // Fallback to empty data structure
        setAnalyticsData({
          overview: {
            totalRevenue: 0,
            totalOrders: 0,
            totalCustomers: 0,
            averageOrderValue: 0,
            growthRate: 0
          },
          dailySales: [],
          topSellingItems: [],
          customerMetrics: {
            newCustomers: 0,
            returningCustomers: 0,
            averageSessionTime: 0,
            customerSatisfaction: 0
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      // Fallback to empty data structure
      setAnalyticsData({
        overview: {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          averageOrderValue: 0,
          growthRate: 0
        },
        dailySales: [],
        topSellingItems: [],
        customerMetrics: {
          newCustomers: 0,
          returningCustomers: 0,
          averageSessionTime: 0,
          customerSatisfaction: 0
        }
      });
      } finally {
        setLoading(false);
      }
    };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div>
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-4 w-80 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="w-24 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>

          {/* Key Metrics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="p-3 bg-gray-200 rounded-xl animate-pulse">
                    <div className="h-6 w-6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Daily Sales Chart Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 rounded-lg animate-pulse">
                  <div className="h-5 w-5"></div>
                </div>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gray-300 h-3 rounded-full animate-pulse" style={{ width: `${Math.random() * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Top Selling Items Skeleton */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-200 rounded-xl animate-pulse">
                  <div className="h-6 w-6"></div>
                </div>
                <div>
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Metrics Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              {/* New Customers Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gray-200 rounded-xl animate-pulse">
                    <div className="h-6 w-6"></div>
                  </div>
                  <div>
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-12 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-gray-300 h-2 rounded-full animate-pulse" style={{ width: `${Math.random() * 100}%` }}></div>
                  </div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mx-auto"></div>
                </div>
              </div>

              {/* Returning Customers Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gray-200 rounded-xl animate-pulse">
                    <div className="h-6 w-6"></div>
                  </div>
                  <div>
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-12 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-gray-300 h-2 rounded-full animate-pulse" style={{ width: `${Math.random() * 100}%` }}></div>
                  </div>
                  <div className="h-3 w-28 bg-gray-200 rounded animate-pulse mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
          <p className="text-gray-500">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to={`/admin/restaurants`} 
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-amber-600 hover:border-amber-300 hover:shadow-md transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
          </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Restaurant Analytics</h1>
              <p className="text-gray-600">Performance insights and sales metrics</p>
        </div>
      </div>

           <div className="flex items-center space-x-3">
             <button className="inline-flex items-center px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-sm">
               <Download className="w-4 h-4 mr-2" />
               Export
             </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.overview.totalRevenue)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{analyticsData.overview.growthRate}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalOrders.toLocaleString()}</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Activity className="w-4 h-4 mr-1" />
                  {Math.round(analyticsData.overview.totalOrders / analyticsData.dailySales.length)} avg/day
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
        </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalCustomers.toLocaleString()}</p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <Users className="w-4 h-4 mr-1" />
                  {analyticsData.customerMetrics.returningCustomers} returning
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
        </div>
      </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.overview.averageOrderValue)}</p>
                <p className="text-sm text-amber-600 flex items-center mt-1">
                  <Target className="w-4 h-4 mr-1" />
                  Per transaction
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Target className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
                </div>

        {/* Daily Sales Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <LineChart className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Daily Sales Performance</h3>
            </div>
             <div className="text-sm text-gray-500">
               Last 7 days
             </div>
          </div>
          
          <div className="space-y-4">
            {analyticsData.dailySales.map((day, index) => {
              const maxRevenue = Math.max(...analyticsData.dailySales.map(d => d.revenue));
              const percentage = (day.revenue / maxRevenue) * 100;
              
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-24 text-sm text-gray-600 font-medium">
                    {formatDate(day.date)}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(day.revenue)}</div>
                    <div className="text-sm text-gray-500">{day.orders} orders</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           {/* Top Selling Items - Takes 2 columns */}
           <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
             <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                 <Award className="h-6 w-6 text-white" />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-gray-900">Top Selling Items</h3>
                 <p className="text-sm text-gray-500">Best performing menu items</p>
               </div>
             </div>
             
             <div className="space-y-4">
               {analyticsData.topSellingItems.map((item, index) => (
                 <div key={item.id} className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-amber-50 hover:to-orange-50 transition-all duration-300 border border-gray-200 hover:border-amber-300">
                   <div className="flex items-center space-x-4">
                     <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                       <span className="text-sm font-bold text-white">#{index + 1}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-semibold text-gray-900 text-base truncate group-hover:text-amber-700 transition-colors">{item.name}</p>
                       <div className="flex items-center space-x-2 mt-1">
                         <span className="text-sm text-gray-600">{item.quantity} sold</span>
                         <span className="text-xs text-gray-400">•</span>
                         <span className="text-sm text-amber-600 font-medium">{formatCurrency(item.revenue)}</span>
                       </div>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">{formatCurrency(item.revenue)}</div>
                     <div className="text-xs text-gray-500">Revenue</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Customer Metrics - Takes 1 column, side by side */}
           <div className="lg:col-span-1 space-y-6">
             {/* New Customers */}
             <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-shadow">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                   <Users className="h-6 w-6 text-white" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-gray-900">New Customers</h3>
                   <p className="text-sm text-gray-500">This period</p>
                 </div>
               </div>
               
               <div className="text-center">
                 <div className="text-5xl font-bold text-green-600 mb-2">{analyticsData.customerMetrics.newCustomers}</div>
                 <div className="w-full bg-green-200 rounded-full h-2">
                   <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{ width: `${Math.min((analyticsData.customerMetrics.newCustomers / 200) * 100, 100)}%` }}></div>
                 </div>
                 <p className="text-xs text-gray-500 mt-2">Growth indicator</p>
               </div>
             </div>

             {/* Returning Customers */}
             <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                   <Users className="h-6 w-6 text-white" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-gray-900">Returning Customers</h3>
                   <p className="text-sm text-gray-500">Loyal customers</p>
                 </div>
               </div>
               
               <div className="text-center">
                 <div className="text-5xl font-bold text-blue-600 mb-2">{analyticsData.customerMetrics.returningCustomers}</div>
                 <div className="w-full bg-blue-200 rounded-full h-2">
                   <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" style={{ width: `${Math.min((analyticsData.customerMetrics.returningCustomers / 500) * 100, 100)}%` }}></div>
                 </div>
                 <p className="text-xs text-gray-500 mt-2">Loyalty indicator</p>
               </div>
             </div>
           </div>
         </div>


      </div>
    </div>
  );
};

export default RestaurantAnalytics;