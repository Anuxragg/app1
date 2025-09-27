import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import { InvestmentModal } from "./InvestmentModal";
import { toast } from "sonner";

interface StartupCardProps {
  startup: Doc<"startups">;
}

export function StartupCard({ startup }: StartupCardProps) {
  const [showInvestModal, setShowInvestModal] = useState(false);
  const userInvestment = useQuery(api.investments.getUserInvestmentInStartup, {
    startupId: startup._id,
  });

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

  const formatValuation = (amount?: number) => {
    if (!amount) return "N/A";
    return formatFunding(amount);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-gray-900">{startup.name}</h3>
                {startup.isTopStartup && (
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                    ⭐ Top 100
                  </span>
                )}
              </div>
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {startup.stage}
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{startup.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Category:</span>
            <span className="font-medium">{startup.category}</span>
          </div>
          
          {startup.valuation && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Valuation:</span>
              <span className="font-medium text-purple-600">
                {formatValuation(startup.valuation)}
              </span>
            </div>
          )}
          
          {startup.fundingAmount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total Funding:</span>
              <span className="font-medium text-green-600">
                {formatFunding(startup.fundingAmount)}
              </span>
            </div>
          )}

          {startup.totalInvestments && startup.totalInvestments > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Community Investments:</span>
              <span className="font-medium text-blue-600">
                {formatFunding(startup.totalInvestments)} ({startup.investorCount} investors)
              </span>
            </div>
          )}
          
          {startup.location && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Location:</span>
              <span className="font-medium">{startup.location}</span>
            </div>
          )}
          
          {startup.foundedYear && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Founded:</span>
              <span className="font-medium">{startup.foundedYear}</span>
            </div>
          )}
          
          {startup.employees && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Employees:</span>
              <span className="font-medium">{startup.employees}</span>
            </div>
          )}
        </div>

        {startup.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {startup.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {userInvestment && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700 font-medium">Your Investment:</span>
              <span className="text-green-800 font-semibold">
                {formatFunding(userInvestment.amount)}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          {startup.website && (
            <a
              href={startup.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Visit Website
            </a>
          )}
          <button
            onClick={() => setShowInvestModal(true)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            💰 Invest
          </button>
        </div>
      </div>

      {showInvestModal && (
        <InvestmentModal
          startup={startup}
          onClose={() => setShowInvestModal(false)}
          existingInvestment={userInvestment}
        />
      )}
    </>
  );
}
