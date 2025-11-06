import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CalendarDays,
  CheckCircle2,
  Sparkles,
  Flame,
  Moon,
  Sun,
  ChefHat,
  Star,
  Zap,
  Heart,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type MealType = "day" | "night";
type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface MealPlanEntry {
  day: Weekday;
  time: MealType;
  menu: string;
}

const weekdays: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MealPlan: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<"monthly" | "custom" | null>(null);
  const [selectedDay, setSelectedDay] = useState<Weekday | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const handleNavigateToPreferences = () => {
    setMobileMenuOpen(false);
    navigate("/choose");
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const resp = await axios.get('https://cafe-chain.onrender.com/admin/meals', { withCredentials: true });
        if (resp.data?.success && Array.isArray(resp.data.plans)) {
          const map: Record<string, string> = {};
          (resp.data.plans as MealPlanEntry[]).forEach((p) => {
            map[`${p.day}-${p.time}`] = p.menu || "";
          });
          setPlans(map);
        }
      } catch (error) {
        console.error('Failed to fetch meal plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const itemsFor = (day: Weekday, time: MealType) =>
    (plans[`${day}-${time}`] || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const priceInfo = useMemo(
    () => ({
      monthly: {
        label: "Monthly Plan",
        desc: "Day + Night for 30 days",
        price: "₹3,500",
      },
      custom: {
        label: "Custom Plan",
        desc: "Pick specific days and times",
        price: "₹80 / meal",
      },
    }),
    []
  );

  const handleBooking = (type: "monthly" | "custom") => {
    if (type === "custom") {
      navigate("/custom-meal-selection");
      return;
    }
    // Toggle: if clicking the same plan, deselect it
    if (booking === type) {
      setBooking(null);
    } else {
      setBooking(type);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden"
      onClick={() => {
        setBooking(null);
        setSelectedDay(null);
        setMobileMenuOpen(false);
      }}
    >

      {/* Floating Navbar */}
      <div className="sticky top-4 z-50 mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-orange-100">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                <ChefHat className="text-white" size={20} />
              </div>
              <div className="text-2xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Sojo
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full">
                <Sparkles className="h-4 w-4 text-orange-600 animate-pulse" />
                <span className="text-sm font-semibold text-orange-800">
                  Eat well, every day
                </span>
              </div>
              {/* Desktop Preferences */}
              <button
                onClick={handleNavigateToPreferences}
                className="hidden md:flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Sparkles className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Preferences</span>
              </button>
              
              {/* Desktop Logout */}
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">Logout</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <>
              {/* Backdrop - starts below navbar */}
              <div 
                className="fixed top-20 left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(false);
                }}
              />
              {/* Menu */}
              <div className="absolute top-full right-4 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-[60] md:hidden">
                <div className="py-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToPreferences();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left group"
                  >
                    <div className="p-2 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
                      <Sparkles className="h-5 w-5 text-orange-600" />
                    </div>
                    <span className="font-medium text-gray-900">Preferences</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors text-left group"
                  >
                    <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                      <LogOut className="h-5 w-5 text-red-600" />
                    </div>
                    <span className="font-medium text-red-600">Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Hero Section with Animation */}
        <div className="mb-12 relative">
          <div className="relative bg-white/80 backdrop-blur-xl border-2 border-orange-200 rounded-3xl p-8 shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-4 shadow-lg">
                  <Flame className="text-white animate-pulse" size={18} />
                  <span className="text-white font-bold text-sm">
                    TRENDING NOW
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
                  Sojo Meal Plans
                  <span className="block text-2xl md:text-3xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mt-2">
                    Your Daily Food Revolution
                  </span>
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                  {[
                    {
                      icon: Heart,
                      text: "Homely cooked, balanced meals",
                      color: "text-red-500",
                    },
                    {
                      icon: Zap,
                      text: "Fresh daily, consistent quality",
                      color: "text-yellow-500",
                    },
                    {
                      icon: Star,
                      text: "Weekly rotating menus",
                      color: "text-orange-500",
                    },
                    {
                      icon: CheckCircle2,
                      text: "Clean ingredients, reliable",
                      color: "text-emerald-500",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-3 p-3 bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all"
                    >
                      <item.icon
                        className={`${item.color} animate-pulse`}
                        size={20}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center w-48 h-48 bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl shadow-2xl transform hover:rotate-6 transition-transform">
                <CalendarDays className="text-white" size={80} />
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Menu Header */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              This Week's Feast
            </span>
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            Daily rotating menus crafted with love
          </p>
        </div>

        {/* Weekly Menu Cards */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            weekdays.map((d, idx) => (
              <div
                key={d}
                className={`group relative bg-white/90 backdrop-blur-sm border-2 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${
                  selectedDay === d ? "scale-[1.02]" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDay(selectedDay === d ? null : d);
                }}
                style={{
                  animationDelay: `${idx * 0.1}s`,
                  borderColor: selectedDay === d ? "#fb923c" : "#fed7aa",
                }}
              >
                <div className="relative flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <span className="text-2xl font-black text-white">
                        {d}
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-gray-900">
                        {d === "Mon"
                          ? "Monday"
                          : d === "Tue"
                          ? "Tuesday"
                          : d === "Wed"
                          ? "Wednesday"
                          : d === "Thu"
                          ? "Thursday"
                          : d === "Fri"
                          ? "Friday"
                          : d === "Sat"
                          ? "Saturday"
                          : "Sunday"}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">
                        Click to expand
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full">
                    <Star className="text-orange-600" size={16} />
                    <span className="text-sm font-bold text-orange-800">
                      Featured
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Day Menu */}
                  <div className="relative overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-lg hover:shadow-xl transition-all">
                    
                    <div className="relative flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Sun
                          className="text-orange-600 animate-pulse"
                          size={24}
                        />
                        <span className="text-xl font-black text-orange-700">
                          Day Menu
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-orange-200 rounded-full">
                        <span className="text-xs font-bold text-orange-800">
                          LUNCH
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {itemsFor(d, "day").length === 0 ? (
                        <span className="text-gray-400 text-sm italic">
                          No items today
                        </span>
                      ) : (
                        itemsFor(d, "day").map((name, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all cursor-pointer border-2 border-orange-300"
                          >
                            <span className="text-sm font-bold text-orange-800">
                              {name}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Night Menu */}
                  <div className="relative overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-lg hover:shadow-xl transition-all">
                    
                    <div className="relative flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Moon
                          className="text-indigo-600 animate-pulse"
                          size={24}
                        />
                        <span className="text-xl font-black text-indigo-700">
                          Night Menu
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-indigo-200 rounded-full">
                        <span className="text-xs font-bold text-indigo-800">
                          DINNER
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {itemsFor(d, "night").length === 0 ? (
                        <span className="text-gray-400 text-sm italic">
                          No items tonight
                        </span>
                      ) : (
                        itemsFor(d, "night").map((name, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all cursor-pointer border-2 border-indigo-300"
                          >
                            <span className="text-sm font-bold text-indigo-800">
                              {name}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Section */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            Flexible options for every lifestyle
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Monthly Plan */}
          <div
            className={`relative group bg-gradient-to-br from-white to-orange-50 rounded-3xl p-8 shadow-2xl border-2 transform hover:scale-105 transition-all duration-300 cursor-pointer ${
              booking === "monthly"
                ? "scale-105 border-orange-500"
                : "border-orange-200"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleBooking("monthly");
            }}
          >
            <div className="absolute top-0 right-0 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-bl-2xl rounded-tr-3xl shadow-lg">
              <span className="text-xs font-black">BEST VALUE</span>
            </div>
            <div className="mt-8">
              <Flame
                className="text-orange-600 mb-4 animate-bounce"
                size={40}
              />
              <h3 className="text-3xl font-black text-gray-900 mb-2">
                {priceInfo.monthly.label}
              </h3>
              <p className="text-gray-600 mb-4">{priceInfo.monthly.desc}</p>
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {priceInfo.monthly.price}
                </span>
                <span className="text-gray-500 ml-2">/month</span>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  "Best value for money",
                  "Auto-renew optional",
                  "Cancel anytime",
                  "Priority support",
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="text-white" size={16} />
                    </div>
                    <span className="text-gray-700 font-medium">{text}</span>
                  </div>
                ))}
              </div>
              <button className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
                Choose Monthly Plan
              </button>
            </div>
          </div>

          {/* Custom Plan */}
          <div
            className={`relative group bg-gradient-to-br from-white to-indigo-50 rounded-3xl p-8 shadow-2xl border-2 transform hover:scale-105 transition-all duration-300 cursor-pointer ${
              booking === "custom"
                ? "scale-105 border-indigo-500"
                : "border-indigo-200"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleBooking("custom");
            }}
          >
            <div className="absolute top-0 right-0 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-bl-2xl rounded-tr-3xl shadow-lg">
              <span className="text-xs font-black">FLEXIBLE</span>
            </div>
            <div className="mt-8">
              <Zap
                className="text-indigo-600 mb-4 animate-bounce"
                size={40}
                style={{ animationDelay: "0.5s" }}
              />
              <h3 className="text-3xl font-black text-gray-900 mb-2">
                {priceInfo.custom.label}
              </h3>
              <p className="text-gray-600 mb-4">{priceInfo.custom.desc}</p>
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {priceInfo.custom.price}
                </span>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  "Pay per meal",
                  "Maximum flexibility",
                  "Change anytime",
                  "No commitment",
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="text-white" size={16} />
                    </div>
                    <span className="text-gray-700 font-medium">{text}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleBooking("custom");
                }}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
              >
                Choose Custom Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlan;
