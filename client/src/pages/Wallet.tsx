import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Wallet, 
  Plus, 
  History, 
  CreditCard,
  TrendingUp,
  Clock
} from 'lucide-react';

interface WalletHistory {
  id: number;
  amount: number;
  modeOfPayment: string;
  createdAt: string;
}

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [paymentMethod] = useState<string>('upi');
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [walletHistory, setWalletHistory] = useState<WalletHistory[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  useEffect(() => {
    // Start fetching data immediately but don't block UI
    fetchWalletData();
  }, []);

  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      setBalanceError(false);
      
      const response = await axios.get('https://cafe-chain.onrender.com/user/getWalletBalance', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setBalance(response.data.balance);
      } else {
        setBalanceError(true);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalanceError(true);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryError(false);
      
      const response = await axios.get('https://cafe-chain.onrender.com/user/walletHistory', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setWalletHistory(response.data.history);
        setHistoryLoaded(true);
      } else {
        setHistoryError(true);
      }
    } catch (error) {
      console.error('Error fetching wallet history:', error);
      setHistoryError(true);
    }
  };

  const fetchWalletData = async () => {
    // Load balance and history in parallel but independently
    fetchBalance();
    fetchHistory();
  };

  const handleTopUp = async () => {
    if (topUpAmount <= 0) {
      // Use toast instead of alert
      import('../utils/toast').then(m => m.showToast('Please enter a valid amount', 'warning'));
      return;
    }

    try {
      setIsToppingUp(true);
      setBalanceLoading(true);
      
      const response = await axios.post('https://cafe-chain.onrender.com/user/addWalletBalance', {
        amount: topUpAmount,
        modeOfPayment: paymentMethod
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        // Success toast
        const { showToast } = await import('../utils/toast');
        showToast('Wallet topped up successfully!', 'success');

        setTopUpAmount(0);
        // Update balance immediately
        setBalance(response.data.balance);
        // Add new transaction to history
        if (response.data.userWallet) {
          setWalletHistory(prev => [response.data.userWallet, ...prev]);
          setHistoryLoaded(true); // Mark as loaded if it wasn't before
        }
      } else {
        // Error toast with backend message
        const { showToast } = await import('../utils/toast');
        const errorMessage = response.data.message || 'Failed to top up';
        showToast(errorMessage, 'error');
      }
    } catch (error: any) {
      // Error toast with backend message
      const { showToast } = await import('../utils/toast');
      const errorMessage = error.response?.data?.message || error.message || 'Failed to top up';
      showToast(errorMessage, 'error');
    } finally {
      setIsToppingUp(false);
      setBalanceLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shimmer {
            0% {
              transform: translateX(-100%) skewX(-12deg);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateX(200%) skewX(-12deg);
              opacity: 0;
            }
          }
          @keyframes pulse-glow {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
          .animate-shimmer {
            animation: shimmer 2.5s infinite ease-in-out;
          }
          .animate-pulse-glow {
            animation: pulse-glow 2s infinite ease-in-out;
          }
        `
      }} />
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Wallet Balance</h2>
              {balanceLoading ? (
                <div className="space-y-3">
                  <div className="relative overflow-hidden">
                    <div className="h-16 bg-gradient-to-r from-white/10 via-white/30 to-white/10 rounded-xl animate-pulse-glow"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
                  </div>
                  <div className="relative overflow-hidden">
                    <div className="h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-lg w-40 animate-pulse-glow"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
                  </div>
                </div>
              ) : balanceError ? (
                <div className="space-y-2">
                  <span className="text-4xl font-bold text-red-200">Error</span>
                  <button 
                    onClick={fetchBalance}
                    className="text-white underline hover:text-gray-200 text-sm"
                  >
                    Retry
                  </button>
                </div>
              ) : balance !== null ? (
                <p className="text-4xl font-bold">₹{balance}</p>
              ) : (
                <p className="text-4xl font-bold">₹0</p>
              )}
              <p className="text-amber-100 mt-2">Available for orders</p>
            </div>
            <div className="p-4 bg-white/20 rounded-full">
              <Wallet className="h-12 w-12" />
            </div>
          </div>
        </div>

        {/* Top Up Section */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-orange-200 p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Plus className="h-6 w-6 mr-2 text-amber-600" />
            Top Up Wallet
          </h3>
          
          {/* Quick Amount Buttons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Amounts
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[100, 200, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTopUpAmount(amount)}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    topUpAmount === amount
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                >
                  ₹{amount}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                UPI
              </div>
            </div>
          </div>
          
          <button
            onClick={handleTopUp}
            disabled={isToppingUp || topUpAmount <= 0}
            className="mt-6 w-full bg-amber-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isToppingUp ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                <span>Top Up Wallet</span>
              </>
            )}
          </button>
        </div>


        {/* Wallet History */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-orange-200 p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <History className="h-6 w-6 mr-2 text-amber-600" />
              Transaction History
            </h3>
          </div>

          <div className="space-y-4">
            {!historyLoaded && !historyError ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="relative overflow-hidden p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative overflow-hidden">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse-glow"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="relative overflow-hidden">
                            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-20 animate-pulse-glow"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
                          </div>
                          <div className="relative overflow-hidden">
                            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-24 animate-pulse-glow"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="relative overflow-hidden">
                          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16 animate-pulse-glow"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
                        </div>
                        <div className="relative overflow-hidden">
                          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-12 animate-pulse-glow"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : historyError ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">
                  <History className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-gray-500">Failed to load transaction history</p>
                </div>
                <button 
                  onClick={fetchHistory}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : walletHistory.length > 0 ? (
              walletHistory.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        +₹{transaction.amount}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        {transaction.modeOfPayment === 'upi' ? 'UPI Payment' : 'Cash Payment'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 flex items-center justify-end mb-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No transaction history yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
