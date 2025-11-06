import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Utensils, ArrowRight } from 'lucide-react';

const ChooseExperience: React.FC = () => {
  const navigate = useNavigate();

  const choose = (choice: 'cafe' | 'meal') => {
    localStorage.setItem('preferred_entry', choice);
    if (choice === 'meal') {
      navigate('/meal-plan', { replace: true });
    } else {
      navigate('/cafe/1', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Navbar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <div className="text-xl font-extrabold tracking-tight text-gray-900">Sojo</div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Choose your experience</h1>
          <p className="text-gray-600 mt-1">Jump into the Cafe to order now, or explore Sojo Meal plans.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            role="button"
            onClick={() => choose('cafe')}
            className="group bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-2xl font-bold text-gray-900">Cafe</div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Coffee className="h-6 w-6" /></div>
            </div>
            <p className="text-gray-600">Browse restaurants, order meals, and track your orders in real time.</p>
            <div className="mt-6 inline-flex items-center text-amber-700 font-medium">
              Continue to Cafe <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

          <div
            role="button"
            onClick={() => choose('meal')}
            className="group bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-2xl font-bold text-gray-900">Sojo Meal</div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><Utensils className="h-6 w-6" /></div>
            </div>
            <p className="text-gray-600">See the weekly plan, transparent pricing, and book custom days.</p>
            <div className="mt-6 inline-flex items-center text-amber-700 font-medium">
              Explore Sojo Meal <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseExperience;


