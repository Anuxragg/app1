import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getPortfolioSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const investments = await ctx.db
      .query("investments")
      .withIndex("by_investor", (q) => q.eq("investorId", userId))
      .collect();

    const investmentsWithStartups = await Promise.all(
      investments.map(async (investment) => {
        const startup = await ctx.db.get(investment.startupId);
        return {
          ...investment,
          startup,
        };
      })
    );

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const uniqueStartups = new Set(investments.map(inv => inv.startupId)).size;

    // Calculate portfolio value based on current startup valuations
    const currentValue = investmentsWithStartups.reduce((sum, inv) => {
      if (!inv.startup?.valuation || !inv.startup?.fundingAmount) {
        return sum + inv.amount; // If no valuation data, assume no change
      }
      
      // Simple calculation: assume investment value scales with startup valuation
      const investmentRatio = inv.amount / (inv.startup.fundingAmount || 1);
      const currentInvestmentValue = (inv.startup.valuation || 0) * investmentRatio * 0.001; // Scale down for realism
      return sum + Math.max(currentInvestmentValue, inv.amount * 0.5); // Minimum 50% of original investment
    }, 0);

    const totalReturn = currentValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Group investments by category
    const categoryBreakdown: Record<string, { amount: number; count: number }> = {};
    investmentsWithStartups.forEach(inv => {
      const category = inv.startup?.category || "Unknown";
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { amount: 0, count: 0 };
      }
      categoryBreakdown[category].amount += inv.amount;
      categoryBreakdown[category].count += 1;
    });

    // Top performing investments
    const topPerformers = investmentsWithStartups
      .map(inv => {
        if (!inv.startup?.valuation || !inv.startup?.fundingAmount) {
          return { ...inv, performance: 0 };
        }
        const investmentRatio = inv.amount / (inv.startup.fundingAmount || 1);
        const currentValue = (inv.startup.valuation || 0) * investmentRatio * 0.001;
        const performance = ((currentValue - inv.amount) / inv.amount) * 100;
        return { ...inv, performance, currentValue };
      })
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);

    return {
      totalInvested,
      currentValue,
      totalReturn,
      returnPercentage,
      uniqueStartups,
      categoryBreakdown,
      topPerformers,
      investments: investmentsWithStartups,
    };
  },
});
