import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface WalletModalProps {
  onClose: () => void;
}

export function WalletModal({ onClose }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<"balance" | "deposit" | "withdraw" | "history">("balance");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wallet = useQuery(api.wallet.getWallet);
  const transactions = useQuery(api.wallet.getTransactions) || [];
  const createWallet = useMutation(api.wallet.createWallet);
  const deposit = useMutation(api.wallet.deposit);
  const withdraw = useMutation(api.wallet.withdraw);

  // Auto-create wallet if it doesn't exist
  useEffect(() => {
    if (wallet === null) {
      createWallet();
    }
  }, [wallet, createWallet]);

  const formatFunding = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const depositAmount = parseFloat(amount);
    
    if (!depositAmount || depositAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await deposit({ amount: depositAmount });
      toast.success(`Successfully deposited ${formatFunding(depositAmount)}`);
      setAmount("");
      setActiveTab("balance");
    } catch (error) {
      toast.error("Failed to deposit funds");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (wallet && withdrawAmount > wallet.balance) {
      toast.error("Insufficient funds");
      return;
    }

    setIsSubmitting(true);
    try {
      await withdraw({ amount: withdrawAmount });
      toast.success(`Successfully withdrew ${formatFunding(withdrawAmount)}`);
      setAmount("");
      setActiveTab("balance");
    } catch (error) {
      toast.error("Failed to withdraw funds");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Wallet</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: "balance", label: "Balance", icon: "💰" },
          { id: "deposit", label: "Deposit", icon: "⬇️" },
          { id: "withdraw", label: "Withdraw", icon: "⬆️" },
          { id: "history", label: "History", icon: "📊" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Balance Tab */}
      {activeTab === "balance" && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Current Balance</h3>
          <div className="text-4xl font-bold text-green-600 mb-4">
            {wallet ? formatFunding(wallet.balance) : "$0"}
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>💡 Demo Mode:</strong> This is simulated money for demonstration purposes.
            </p>
          </div>
        </div>
      )}

      {/* Deposit Tab */}
      {activeTab === "deposit" && (
        <div>
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">⬇️</div>
            <h3 className="text-xl font-semibold text-gray-900">Add Funds</h3>
            <p className="text-gray-600">Add demo money to your wallet</p>
          </div>
          
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Amount ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                min="1"
                step="1"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Demo Mode:</strong> This adds simulated money to your account.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Deposit Funds"}
            </button>
          </form>
        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === "withdraw" && (
        <div>
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">⬆️</div>
            <h3 className="text-xl font-semibold text-gray-900">Withdraw Funds</h3>
            <p className="text-gray-600">
              Available: <span className="font-semibold text-green-600">
                {wallet ? formatFunding(wallet.balance) : "$0"}
              </span>
            </p>
          </div>
          
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                min="1"
                max={wallet?.balance || 0}
                step="1"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !wallet || parseFloat(amount) > wallet.balance}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Withdraw Funds"}
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Transaction History</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      transaction.type === "deposit" 
                        ? "bg-green-100 text-green-600" 
                        : transaction.type === "withdrawal"
                        ? "bg-red-100 text-red-600"
                        : "bg-blue-100 text-blue-600"
                    }`}>
                      {transaction.type === "deposit" ? "⬇️" : transaction.type === "withdrawal" ? "⬆️" : "💰"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      {"startup" in transaction && transaction.startup && (
                        <p className="text-sm text-gray-600">{transaction.startup.name}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(transaction._creationTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.type === "deposit" 
                      ? "text-green-600" 
                      : transaction.type === "withdrawal"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}>
                    {transaction.type === "withdrawal" ? "-" : "+"}{formatFunding(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
