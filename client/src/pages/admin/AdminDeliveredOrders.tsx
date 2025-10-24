import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Calendar, Clock, IndianRupee, PackageCheck, User, ArrowLeft } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

interface DeliveredOrderItem {
  id: number;
  quantity: number;
  menu: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
}

interface DeliveredOrder {
  id: number;
  totalPrice: number;
  createdAt: string;
  status: string;
  orderItems: DeliveredOrderItem[];
  user: { id: number; name: string; email: string; number?: string };
}

const AdminDeliveredOrders: React.FC = () => {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [orders, setOrders] = useState<DeliveredOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRestoId, setSelectedRestoId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const paramRestoId = params.get('restoId');
      const cached = localStorage.getItem('allResto_cache');
      if (cached) {
        const restos = JSON.parse(cached);
        if (paramRestoId) {
          setSelectedRestoId(parseInt(paramRestoId));
        } else if (restos?.length) {
          setSelectedRestoId(restos[0].id);
        }
      }
    } catch {}
  }, []);

  const fetchDelivered = async () => {
    if (!selectedRestoId) return;
    setLoading(true);
    try {
      const resp = await axios.post(`https://cafe-chain.onrender.com/admin/resto/${selectedRestoId}/deliveredOrders`, { date });
      if (resp.data?.success) {
        setOrders(resp.data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error('Failed to fetch delivered orders', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivered();
  }, [selectedRestoId, date]);

  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + o.totalPrice, 0), [orders]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/admin" className="text-gray-600 hover:text-amber-600 px-3 py-2 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Delivered Orders</h1>
          </div>
          <p className="text-gray-600">Daily history of delivered orders per restaurant</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedRestoId ?? ''}
            onChange={(e) => setSelectedRestoId(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            {(JSON.parse(localStorage.getItem('allResto_cache') || '[]') as any[]).map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Showing delivered orders for <span className="font-medium">{(() => { const [y,m,d] = date.split('-'); return `${d}/${m}/${y}`; })()}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{(() => { const [y,m,d] = date.split('-'); return `${d}/${m}/${y}`; })()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <PackageCheck className="w-4 h-4" />
            <span className="text-sm">{orders.length} orders</span>
          </div>
          <div className="flex items-center gap-2 text-amber-700 font-semibold">
            <IndianRupee className="w-4 h-4" />
            <span>₹{totalRevenue}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-600">No delivered orders for the selected day.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200 flex flex-col h-full w-full"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">#{order.id}</span>
                    <span className="text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <PackageCheck className="w-3 h-3" /> Delivered
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(order.createdAt).toLocaleTimeString()}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 text-amber-700 font-semibold text-base">
                  <IndianRupee className="w-4 h-4" /> {order.totalPrice}
                </div>
              </div>

              {/* Customer */}
              <div className="mt-3 flex items-start gap-2 text-sm text-gray-700">
                <User className="w-4 h-4 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">{order.user?.name || 'User'}</div>
                  <div className="text-xs text-gray-600">{order.user?.number || '—'}</div>
                </div>
              </div>

              {/* Items */}
              <div className={`mt-4 grid grid-cols-1 gap-3 content-start relative ${expanded[order.id] ? '' : 'max-h-28 overflow-hidden'}`}>
                {order.orderItems.map((oi) => (
                  <div key={oi.id} className="flex items-center gap-3 border border-gray-200 rounded-xl p-2">
                    <img
                      src={oi.menu.imageUrl}
                      alt={oi.menu.name}
                      className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate break-words">{oi.menu.name}</div>
                      <div className="text-[11px] text-gray-600">Qty: {oi.quantity}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 whitespace-nowrap flex-shrink-0 ml-2">₹{oi.menu.price * oi.quantity}</div>
                  </div>
                ))}
                {!expanded[order.id] && order.orderItems.length > 2 && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent col-span-2" />
                )}
              </div>

              {order.orderItems.length > 2 && (
                <div className="mt-2 text-center">
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                    className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {expanded[order.id] ? 'Show less' : `View full order (+${order.orderItems.length - 2})`}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDeliveredOrders;


