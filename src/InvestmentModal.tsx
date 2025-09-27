import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import { toast } from "sonner";

interface InvestmentModalProps {
  startup: Doc<"startups">;
  onClose: () => void;
  existingInvestment?: {
    amount: number;
    notes?: string;
  } | null;
}

export function InvestmentModal({ startup, onClose, existingInvestment }: InvestmentModalProps) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invest = useMutation(api.investments.invest);
  const wallet = useQuery(api.wallet.getWallet);

  const formatFunding = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const investmentAmount = parseFloat(amount);
    if (!investmentAmount || investmentAmount <= 0) {
      toast.error("Please enter a valid investment amount");
      return;
    }

    if (investmentAmount < 100) {
      toast.error("Minimum investment amount is $100");
      return;
    }

    if (wallet && investmentAmount > wallet.balance) {
      toast.error("Insufficient wallet balance");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await invest({
        startupId: startup._id,
        amount: investmentAmount,
        notes: notes.trim() || undefined,
      });

      toast.success(
        existingInvestment 
          ? `Successfully added $${investmentAmount.toLocaleString()} to your investment in ${startup.name}!`
          : `Successfully invested $${investmentAmount.toLocaleString()} in ${startup.name}!`
      );
      onClose();
    } catch (error) {
      toast.error("Failed to process investment");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {existingInvestment ? "Add to Investment" : "Invest in"} {startup.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              {startup.logoUrl ? (
                <img
                  src={startup.logoUrl}
                  alt={`${startup.name} logo`}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {startup.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{startup.name}</h3>
                <p className="text-sm text-gray-600">{startup.category} • {startup.stage}</p>
              </div>
            </div>

            {/* Wallet Balance */}
            {wallet && (
              <div className="bg-green-50 p-3 rounded-lg mb-4 border border-green-200">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Wallet Balance:</span>
                  <span className="font-semibold text-green-800">
                    {formatFunding(wallet.balance)}
                  </span>
                </div>
              </div>
            )}

            {startup.valuation && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Valuation:</span>
                  <span className="font-semibold text-purple-600">
                    {formatFunding(startup.valuation)}
                  </span>
                </div>
              </div>
            )}

            {existingInvestment && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Your Current Investment:</span>
                  <span className="font-semibold text-blue-800">
                    {formatFunding(existingInvestment.amount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                min="100"
                max={wallet?.balance || 0}
                step="100"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: $100 • Available: {wallet ? formatFunding(wallet.balance) : "$0"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why are you investing in this startup?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Disclaimer:</strong> This is a simulated investment platform for demonstration purposes. 
                No real money will be exchanged.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting || !wallet || parseFloat(amount) > wallet.balance}
              >
                {isSubmitting ? "Processing..." : existingInvestment ? "Add Investment" : "Invest Now"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
