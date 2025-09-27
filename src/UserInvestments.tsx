import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface UserInvestmentsProps {
  onClose: () => void;
}

export function UserInvestments({ onClose }: UserInvestmentsProps) {
  const investments = useQuery(api.investments.getUserInvestments) || [];

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

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Investments</h2>
          <p className="text-gray-600">
            Total invested: <span className="font-semibold text-green-600">{formatFunding(totalInvested)}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      {investments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No investments yet</h3>
          <p className="text-gray-600">Start investing in startups to see them here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {investments.map((investment) => (
            <div
              key={investment._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {investment.startup?.logoUrl ? (
                    <img
                      src={investment.startup.logoUrl}
                      alt={`${investment.startup.name} logo`}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {investment.startup?.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {investment.startup?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {investment.startup?.category} • {investment.startup?.stage}
                    </p>
                    <p className="text-xs text-gray-500">
                      Invested on {new Date(investment.investmentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    {formatFunding(investment.amount)}
                  </div>
                  {investment.startup?.valuation && (
                    <div className="text-sm text-gray-500">
                      Valuation: {formatFunding(investment.startup.valuation)}
                    </div>
                  )}
                </div>
              </div>
              
              {investment.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Notes:</strong> {investment.notes}
                  </p>
                </div>
              )}

              {investment.startup?.website && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <a
                    href={investment.startup.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Visit Website →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
