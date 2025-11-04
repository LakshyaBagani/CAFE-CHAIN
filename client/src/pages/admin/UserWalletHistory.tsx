import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar';
import { ArrowLeft, Wallet, History, Mail, Phone } from 'lucide-react';
import { showToast } from '../../utils/toast';

interface WalletHistoryItem {
  id: number;
  amount: number;
  modeOfPayment: string;
  createdAt: string;
}

interface UserInfo {
  id: number;
  name: string;
  email: string;
  number: string;
  balance: number;
}

const UserWalletHistory: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [walletHistory, setWalletHistory] = useState<WalletHistoryItem[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      // Use user info passed from Users page to avoid extra API call
      const stateUser = (location as any).state?.userInfo as UserInfo | undefined;
      if (stateUser) {
        setUserInfo(stateUser);
      }
      fetchWalletHistory();
    }
  }, [userId, location]);

  const fetchWalletHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://cafe-chain.onrender.com/admin/users/${userId}/walletHistory`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setWalletHistory(response.data.history);
      }
    } catch (error: any) {
      console.error('Failed to fetch wallet history:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch wallet history';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // No user info fetch here; rely on navigation state from Users page

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalDeposits = walletHistory
    .filter(item => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
          <div className="flex-1 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Users</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet History</h1>
            <p className="text-gray-600">Transaction history and wallet details</p>
          </div>

          {/* User Info Card */}
          {userInfo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-semibold">
                      {userInfo.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{userInfo.name}</h2>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{userInfo.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{userInfo.number}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                  <p className="text-3xl font-bold text-amber-600">
                    ₹{userInfo.balance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {walletHistory.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{walletHistory.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <History className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Deposits</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{totalDeposits.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Wallet className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Recent Activity</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {walletHistory.filter(item => {
                        const date = new Date(item.createdAt);
                        const now = new Date();
                        const diffTime = Math.abs(now.getTime() - date.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 7;
                      }).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Wallet className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : walletHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-gray-500">This user hasn't made any wallet transactions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {walletHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${
                          item.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Wallet className={`h-6 w-6 ${
                            item.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className={`font-semibold text-lg ${
                            item.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.amount > 0 ? '+' : ''}₹{Math.abs(item.amount).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{item.modeOfPayment}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.amount > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.amount > 0 ? 'Credit' : 'Debit'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserWalletHistory;

