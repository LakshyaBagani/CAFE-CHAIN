import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { CalendarDays, Save, Plus, Trash2, Sun, Moon } from 'lucide-react';
import axios from 'axios';
// import { Link } from 'react-router-dom';

type MealType = 'day' | 'night';
type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

interface MealItem {
  id: string;
  name: string;
  price: string;
  veg: boolean;
}

interface DayPlan {
  day: Weekday;
  dayMeals: MealItem[];
  nightMeals: MealItem[];
}

const weekdays: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Meals: React.FC = () => {
  const initial: DayPlan[] = useMemo(
    () =>
      weekdays.map((d) => ({
        day: d,
        dayMeals: [],
        nightMeals: [],
      })),
    []
  );

  const [plans, setPlans] = useState<DayPlan[]>(initial);
  const [editModeMap, setEditModeMap] = useState<Record<string, boolean>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [lastSavedMap, setLastSavedMap] = useState<Record<string, string>>({});
  const [loadingPlans, setLoadingPlans] = useState(false);

  const keyFor = (dayIdx: number, type: MealType) => `${dayIdx}-${type}`;
  const buildMenuString = (items: MealItem[]) => items.map((m) => m.name.trim()).filter(Boolean).join(',');
  const getMenuString = (dayIdx: number, type: MealType) =>
    buildMenuString(type === 'day' ? plans[dayIdx].dayMeals : plans[dayIdx].nightMeals);
  const isDirty = (dayIdx: number, type: MealType) =>
    getMenuString(dayIdx, type) !== (lastSavedMap[keyFor(dayIdx, type)] ?? '');

  const setColumnFromString = (dayIdx: number, type: MealType, menu: string) => {
    const items: MealItem[] = (menu || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ id: crypto.randomUUID(), name, price: '', veg: true }));
    setPlans((prev) => {
      const copy = [...prev];
      if (type === 'day') copy[dayIdx].dayMeals = items;
      else copy[dayIdx].nightMeals = items;
      return copy;
    });
  };
  const addMeal = (dayIdx: number, type: MealType) => {
    setPlans((prev) => {
      const copy = [...prev];
      const list = type === 'day' ? copy[dayIdx].dayMeals : copy[dayIdx].nightMeals;
      list.push({ id: crypto.randomUUID(), name: '', price: '', veg: true });
      return copy;
    });
  };

  const toggleEdit = (dayIdx: number, type: MealType) => {
    const k = keyFor(dayIdx, type);
    setEditModeMap((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const cancelEdit = (dayIdx: number, type: MealType) => {
    const k = keyFor(dayIdx, type);
    const saved = lastSavedMap[k] ?? '';
    setColumnFromString(dayIdx, type, saved);
    setEditModeMap((prev) => ({ ...prev, [k]: false }));
  };

  const saveSingle = async (dayIdx: number, type: MealType) => {
    try {
      const p = plans[dayIdx];
      const menu = type === 'day' ? buildMenuString(p.dayMeals) : buildMenuString(p.nightMeals);
      const k = keyFor(dayIdx, type);
      setSavingMap((prev) => ({ ...prev, [k]: true }));
      await axios.post('https://cafe-chain.onrender.com/admin/meals/set', { day: p.day, time: type, menu }, { withCredentials: true });
      setLastSavedMap((prev) => ({ ...prev, [k]: menu }));
      const { showToast } = await import('../../utils/toast');
      showToast(`${p.day} ${type === 'day' ? 'Day' : 'Night'} menu saved`, 'success');
      // Exit edit mode after success so only Edit is shown
      setEditModeMap((prev) => ({ ...prev, [k]: false }));
    } catch (error: any) {
      const { showToast } = await import('../../utils/toast');
      showToast(error.response?.data?.message || 'Failed to save menu', 'error');
    } finally {
      const k = keyFor(dayIdx, type);
      setSavingMap((prev) => ({ ...prev, [k]: false }));
    }
  };

  const updateMeal = (dayIdx: number, type: MealType, mealId: string, patch: Partial<MealItem>) => {
    setPlans((prev) => {
      const copy = [...prev];
      const list = type === 'day' ? copy[dayIdx].dayMeals : copy[dayIdx].nightMeals;
      const idx = list.findIndex((m) => m.id === mealId);
      if (idx !== -1) list[idx] = { ...list[idx], ...patch };
      return copy;
    });
  };

  const deleteMeal = (dayIdx: number, type: MealType, mealId: string) => {
    setPlans((prev) => {
      const copy = [...prev];
      const list = type === 'day' ? copy[dayIdx].dayMeals : copy[dayIdx].nightMeals;
      copy[dayIdx] = {
        ...copy[dayIdx],
        [type === 'day' ? 'dayMeals' : 'nightMeals']: list.filter((m) => m.id !== mealId),
      } as DayPlan;
      return copy;
    });
  };

  // Bulk save removed; per-column saving only

  // Fetch existing meal plans from backend and hydrate UI
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const resp = await axios.get('https://cafe-chain.onrender.com/admin/meals', { withCredentials: true });
        if (resp.data?.success && Array.isArray(resp.data.plans)) {
          const byKey = new Map<string, string>();
          for (const p of resp.data.plans as Array<{ day: Weekday; time: MealType; menu: string }>) {
            byKey.set(`${p.day}-${p.time}`, p.menu || '');
          }

          const toItems = (menu: string): MealItem[] =>
            (menu || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .map((name) => ({ id: crypto.randomUUID(), name, price: '', veg: true }));

          const hydrated: DayPlan[] = weekdays.map((d) => ({
            day: d,
            dayMeals: toItems(byKey.get(`${d}-day`) || ''),
            nightMeals: toItems(byKey.get(`${d}-night`) || ''),
          }));
          setPlans(hydrated);

          // Seed lastSavedMap so Save buttons start disabled until changes
          setLastSavedMap(() => {
            const m: Record<string, string> = {};
            hydrated.forEach((p, idx) => {
              m[keyFor(idx, 'day')] = buildMenuString(p.dayMeals);
              m[keyFor(idx, 'night')] = buildMenuString(p.nightMeals);
            });
            return m;
          });
        }
      } catch (e) {
        // ignore for now
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <AdminSidebar />
      <div className="flex-1 md:ml-64">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
          {/* subtle decorative background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-200/20 blur-3xl" />
          </div>
          {/* Header */}
          <div className="rounded-2xl shadow-sm border border-amber-100 p-6 mb-8 bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Weekly Meal Planner</h1>
                  <p className="text-sm text-amber-700">Create day and night menus for each day</p>
                </div>
              </div>
              {/* legend */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                  <Sun className="h-3 w-3" /> Day
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                  <Moon className="h-3 w-3" /> Night
                </span>
              </div>
            </div>
          </div>

          {/* Seven-day planner grid with Day & Night columns */}
           {loadingPlans && (
             <div className="space-y-6">
               {weekdays.map((d) => (
                 <div key={d} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                   <div className="h-5 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {[0,1].map((i) => (
                       <div key={i} className="border border-gray-200 rounded-xl p-4">
                         <div className="flex items-center justify-between mb-3">
                           <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                           <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
                         </div>
                         <div className="space-y-3">
                           {Array.from({ length: 2 }).map((_, idx) => (
                             <div key={idx} className="h-10 bg-gray-100 rounded animate-pulse" />
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
           )}
           <div className="space-y-6">
            {plans.map((plan, dayIdx) => (
              <div key={plan.day} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 transition-all hover:shadow-md hover:ring-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <CalendarDays className="h-5 w-5 text-amber-600" />
                    <span>{plan.day}</span>
                  </h2>
                  <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500">
                    <div className="inline-flex items-center space-x-1"><Sun className="h-3 w-3 text-amber-500" /><span>Day</span></div>
                    <div className="inline-flex items-center space-x-1"><Moon className="h-3 w-3 text-indigo-500" /><span>Night</span></div>
                  </div>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* decorative divider between Day and Night on large screens */}
                  <div className="hidden md:block pointer-events-none absolute inset-y-2 left-1/2 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
                  {/* Day column */}
                  <div className="rounded-xl p-4 bg-amber-50 ring-1 ring-amber-200 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                  <div className="inline-flex items-center gap-2 text-amber-800 font-semibold leading-none bg-amber-50 border border-amber-200 rounded-full px-3 py-1"><Sun className="h-4 w-4" /><span>Day Menu</span></div>
                        {!editModeMap[keyFor(dayIdx,'day')] && plan.dayMeals.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-base text-gray-900">
                            {plan.dayMeals.map((meal) => (
                              <span
                                key={meal.id}
                          className="truncate inline-flex w-full items-center justify-center text-center px-3 py-1.5 rounded-md bg-white text-amber-900 border border-amber-200 shadow-sm"
                              >
                                {meal.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => (editModeMap[keyFor(dayIdx,'day')] ? addMeal(dayIdx, 'day') : toggleEdit(dayIdx,'day'))} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm shadow-sm">
                          {editModeMap[keyFor(dayIdx,'day')] || plans[dayIdx].dayMeals.length === 0 ? <Plus className="h-4 w-4" /> : null}
                          <span>{editModeMap[keyFor(dayIdx,'day')] || plans[dayIdx].dayMeals.length === 0 ? 'Add' : 'Edit'}</span>
                        </button>
                  <button onClick={() => saveSingle(dayIdx, 'day')} disabled={!isDirty(dayIdx,'day') || savingMap[keyFor(dayIdx,'day')]} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm shadow-sm ${(!isDirty(dayIdx,'day') || savingMap[keyFor(dayIdx,'day')]) ? 'bg-amber-400 cursor-not-allowed text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}>
                          {savingMap[keyFor(dayIdx,'day')] ? <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                          <span>{savingMap[keyFor(dayIdx,'day')] ? 'Saving...' : 'Save'}</span>
                        </button>
                        {editModeMap[keyFor(dayIdx,'day')] && (
                    <button onClick={() => cancelEdit(dayIdx,'day')} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm">
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {editModeMap[keyFor(dayIdx,'day')] && (
                        <>
                          {plan.dayMeals.map((meal) => (
                            <div key={meal.id} className="grid grid-cols-12 gap-3 items-center border border-gray-200 rounded-xl p-3">
                              <input value={meal.name} onChange={(e) => updateMeal(dayIdx, 'day', meal.id, { name: e.target.value })} placeholder="Dish Name" className={`col-span-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 border-gray-300 bg-white`} />
                              <button onClick={() => deleteMeal(dayIdx, 'day', meal.id)} className="col-span-2 inline-flex items-center justify-center text-red-600 hover:text-red-700" title="Remove item">
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                      {plan.dayMeals.length === 0 && (
                        <div className="text-center py-6 text-gray-500 text-sm">No items yet. Click Add.</div>
                      )}
                    </div>
                  </div>

                   {/* Night column */}
                   <div className="rounded-xl p-4 bg-indigo-50 ring-1 ring-indigo-200 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                  <div className="inline-flex items-center gap-2 text-indigo-800 font-semibold leading-none bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1"><Moon className="h-4 w-4" /><span>Night Menu</span></div>
                        {!editModeMap[keyFor(dayIdx,'night')] && plan.nightMeals.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-base text-gray-900">
                            {plan.nightMeals.map((meal) => (
                              <span
                                key={meal.id}
                          className="truncate inline-flex w-full items-center justify-center text-center px-3 py-1.5 rounded-md bg-white text-indigo-900 border border-indigo-200 shadow-sm"
                              >
                                {meal.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => (editModeMap[keyFor(dayIdx,'night')] ? addMeal(dayIdx, 'night') : toggleEdit(dayIdx,'night'))} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm shadow-sm">
                          {editModeMap[keyFor(dayIdx,'night')] || plans[dayIdx].nightMeals.length === 0 ? <Plus className="h-4 w-4" /> : null}
                          <span>{editModeMap[keyFor(dayIdx,'night')] || plans[dayIdx].nightMeals.length === 0 ? 'Add' : 'Edit'}</span>
                        </button>
                  <button onClick={() => saveSingle(dayIdx, 'night')} disabled={!isDirty(dayIdx,'night') || savingMap[keyFor(dayIdx,'night')]} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm shadow-sm ${(!isDirty(dayIdx,'night') || savingMap[keyFor(dayIdx,'night')]) ? 'bg-amber-400 cursor-not-allowed text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}>
                          {savingMap[keyFor(dayIdx,'night')] ? <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                          <span>{savingMap[keyFor(dayIdx,'night')] ? 'Saving...' : 'Save'}</span>
                        </button>
                        {editModeMap[keyFor(dayIdx,'night')] && (
                    <button onClick={() => cancelEdit(dayIdx,'night')} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm">
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {editModeMap[keyFor(dayIdx,'night')] && (
                        <>
                          {plan.nightMeals.map((meal) => (
                            <div key={meal.id} className="grid grid-cols-12 gap-3 items-center border border-gray-200 rounded-xl p-3">
                              <input value={meal.name} onChange={(e) => updateMeal(dayIdx, 'night', meal.id, { name: e.target.value })} placeholder="Dish Name" className={`col-span-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 border-gray-300 bg-white`} />
                              <button onClick={() => deleteMeal(dayIdx, 'night', meal.id)} className="col-span-2 inline-flex items-center justify-center text-red-600 hover:text-red-700" title="Remove item">
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                      {plan.nightMeals.length === 0 && (
                        <div className="text-center py-6 text-gray-500 text-sm">No items yet. Click Add.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meals;


