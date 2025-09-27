import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { StartupCard } from "./StartupCard";
import { AddStartupForm } from "./AddStartupForm";
import { UserInvestments } from "./UserInvestments";
import { PortfolioModal } from "./PortfolioModal";
import { WalletModal } from "./WalletModal";
import { toast } from "sonner";

export function StartupAggregator() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInvestments, setShowInvestments] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showTopStartupsOnly, setShowTopStartupsOnly] = useState(false);

  const categories = useQuery(api.startups.getCategories) || [];
  const stages = useQuery(api.startups.getStages) || [];
  const wallet = useQuery(api.wallet.getWallet);
  const seedTopStartups = useMutation(api.seedData.seedTopStartups);

  // Use search if there's a search term, otherwise use regular list
  const searchResults = useQuery(
    api.startups.search,
    searchTerm.trim() 
      ? { 
          searchTerm: searchTerm.trim(),
          category: selectedCategory || undefined,
          stage: selectedStage || undefined,
        }
      : "skip"
  );

  const listResults = useQuery(
    api.startups.list,
    !searchTerm.trim()
      ? {
          paginationOpts: { numItems: 50, cursor: null },
          category: selectedCategory || undefined,
          stage: selectedStage || undefined,
        }
      : "skip"
  );

  let startups = searchTerm.trim() ? searchResults : listResults?.page;

  // Filter for top startups if the toggle is on
  if (showTopStartupsOnly && startups) {
    startups = startups.filter(startup => startup.isTopStartup);
  }

  const handleSeedData = async () => {
    try {
      const result = await seedTopStartups();
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to seed startup data");
      console.error(error);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Startup Directory</h1>
          <p className="text-gray-600">Discover and invest in innovative startups</p>
          {wallet && (
            <p className="text-sm text-gray-500 mt-1">
              Wallet Balance: <span className="font-semibold text-green-600">{formatFunding(wallet.balance)}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowWallet(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            💳 Wallet
          </button>
          <button
            onClick={() => setShowPortfolio(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            📈 Portfolio
          </button>
          <button
            onClick={() => setShowInvestments(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            💰 Investments
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ➕ Add Startup
          </button>
          <button
            onClick={handleSeedData}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            ⭐ Load Top 100
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search startups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Stages</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="topStartupsOnly"
            checked={showTopStartupsOnly}
            onChange={(e) => setShowTopStartupsOnly(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="topStartupsOnly" className="text-sm font-medium text-gray-700">
            Show only Top 100 startups ⭐
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {startups?.map((startup) => (
          <StartupCard key={startup._id} startup={startup} />
        ))}
      </div>

      {startups?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No startups found</p>
          <p className="text-gray-400">Try adjusting your search or filters, or load the Top 100 startups</p>
        </div>
      )}

      {/* Modals */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AddStartupForm onClose={() => setShowAddForm(false)} />
          </div>
        </div>
      )}

      {showInvestments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <UserInvestments onClose={() => setShowInvestments(false)} />
          </div>
        </div>
      )}

      {showPortfolio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <PortfolioModal onClose={() => setShowPortfolio(false)} />
          </div>
        </div>
      )}

      {showWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <WalletModal onClose={() => setShowWallet(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
