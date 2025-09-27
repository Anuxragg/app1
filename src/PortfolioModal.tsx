import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface PortfolioModalProps {
  onClose: () => void;
}

export function PortfolioModal({ onClose }: PortfolioModalProps) {
  const portfolio = useQuery(api.portfolio.getPortfolioSummary);

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

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(1)}%`;
  };

  if (!portfolio) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Portfolio</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      {portfolio.investments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No investments yet</h3>
          <p className="text-gray-600">Start investing to build your portfolio!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-700 mb-1">Total Invested</h3>
              <p className="text-2xl font-bold text-blue-900">
                {formatFunding(portfolio.totalInvested)}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-700 mb-1">Current Value</h3>
              <p className="text-2xl font-bold text-green-900">
                {formatFunding(portfolio.currentValue)}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              portfolio.totalReturn >= 0 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            }`}>
              <h3 className={`text-sm font-medium mb-1 ${
                portfolio.totalReturn >= 0 ? "text-green-700" : "text-red-700"
              }`}>
                Total Return
              </h3>
              <p className={`text-2xl font-bold ${
                portfolio.totalReturn >= 0 ? "text-green-900" : "text-red-900"
              }`}>
                {formatFunding(portfolio.totalReturn)}
              </p>
              <p className={`text-sm ${
                portfolio.totalReturn >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {formatPercentage(portfolio.returnPercentage)}
              </p>
            </div>
          </div>

          {/* Portfolio Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment by Category</h3>
              <div className="space-y-3">
                {Object.entries(portfolio.categoryBreakdown).map(([category, data]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{category}</span>
                      <span className="text-sm text-gray-500 ml-2">({data.count} startups)</span>
                    </div>
                    <span className="font-semibold text-blue-600">
                      {formatFunding(data.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
              <div className="space-y-3">
                {portfolio.topPerformers.slice(0, 5).map((investment) => (
                  <div key={investment._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {investment.startup?.logoUrl ? (
                        <img
                          src={investment.startup.logoUrl}
                          alt={`${investment.startup.name} logo`}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">
                            {investment.startup?.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium text-gray-900 text-sm">
                        {investment.startup?.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        investment.performance >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {formatPercentage(investment.performance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio Overview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{portfolio.uniqueStartups}</p>
                <p className="text-sm text-gray-600">Startups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{portfolio.investments.length}</p>
                <p className="text-sm text-gray-600">Investments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {portfolio.investments.length > 0 
                    ? formatFunding(portfolio.totalInvested / portfolio.investments.length)
                    : "$0"
                  }
                </p>
                <p className="text-sm text-gray-600">Avg Investment</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${
                  portfolio.returnPercentage >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatPercentage(portfolio.returnPercentage)}
                </p>
                <p className="text-sm text-gray-600">Total Return</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
