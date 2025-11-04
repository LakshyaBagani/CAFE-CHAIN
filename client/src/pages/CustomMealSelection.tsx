import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';

const CustomMealSelection: React.FC = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const calculateTotal = useMemo(() => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return 0;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    // 2 meals per day (day + night) * ₹80 per meal
    return diffDays * 2 * 80;
  }, [startDate, endDate]);

  const numberOfDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/meal-plan')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Meal Plans</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Custom Meal Plan</h1>
          <p className="text-gray-600 mt-2">Select your date range for personalized meal delivery</p>
        </div>

        {/* Date Selection Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select Date Range</h2>
              <p className="text-sm text-gray-600">Choose from and to dates for your meal plan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {startDate && endDate && new Date(startDate) > new Date(endDate) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">End date must be after start date</p>
            </div>
          )}
        </div>

        {/* Total Amount Card */}
        {startDate && endDate && new Date(startDate) <= new Date(endDate) && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 shadow-lg border-2 border-indigo-200">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-600 mb-2">Selected Period</div>
              <div className="text-2xl font-bold text-gray-900">
                {numberOfDays} {numberOfDays === 1 ? 'day' : 'days'}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {numberOfDays * 2} meals total (Day + Night each day)
              </div>
            </div>
            
            <div className="border-t border-indigo-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-700">
                  <div className="text-sm">Price per meal</div>
                  <div className="text-lg font-semibold">₹80</div>
                </div>
                <div className="text-4xl font-black text-indigo-700">
                  ×
                </div>
                <div className="text-gray-700">
                  <div className="text-sm">Total meals</div>
                  <div className="text-lg font-semibold">{numberOfDays * 2}</div>
                </div>
              </div>
              
              <div className="border-t-2 border-indigo-300 pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-gray-900">Total Amount</div>
                  <div className="text-4xl font-black text-indigo-700">
                    ₹{calculateTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
              Proceed to Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomMealSelection;

