import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, TrendingUp, DollarSign } from 'lucide-react';

interface DailyRevenue {
  date: string;
  revenue: number;
}

const RestaurantAnalytics: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailyRevenue[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/admin/resto/${restaurantId}/dailyRevenue`, { withCredentials: true });
        if (res.data.success) {
          setData(res.data.revenue || []);
        } else {
          setData([]);
        }
      } catch (e) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Link to={`/admin/restaurants/${restaurantId}/orders`} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Orders</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="font-semibold">Total Revenue</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">₹{total.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">Days Tracked</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{data.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span className="font-semibold">Avg / Day</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">₹{Math.round(total / Math.max(1, data.length)).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Daily Revenue</h3>
        <div className="space-y-3">
          {data.map((d, idx) => (
            <div key={idx} className="flex items-center space-x-4">
              <div className="w-32 text-sm text-gray-600">{new Date(d.date).toLocaleDateString()}</div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full" style={{ width: `${(d.revenue / Math.max(...data.map(x => x.revenue), 1)) * 100}%` }} />
                </div>
              </div>
              <div className="w-24 text-right font-medium text-gray-900">₹{d.revenue}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantAnalytics;


