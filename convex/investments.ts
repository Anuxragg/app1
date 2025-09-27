import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const invest = mutation({
  args: {
    startupId: v.id("startups"),
    amount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to invest");
    }

    if (args.amount <= 0) {
      throw new Error("Investment amount must be positive");
    }

    const startup = await ctx.db.get(args.startupId);
    if (!startup) {
      throw new Error("Startup not found");
    }

    // Check wallet balance
    let wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) {
      // Create wallet with initial balance if it doesn't exist
      const walletId = await ctx.db.insert("wallets", {
        userId,
        balance: 100000, // Start with $100k demo money
      });
      wallet = await ctx.db.get(walletId);
    }

    if (wallet!.balance < args.amount) {
      throw new Error("Insufficient wallet balance");
    }

    // Deduct from wallet
    await ctx.db.patch(wallet!._id, {
      balance: wallet!.balance - args.amount,
    });

    // Check if user already invested in this startup
    const existingInvestment = await ctx.db
      .query("investments")
      .withIndex("by_startup_and_investor", (q) => 
        q.eq("startupId", args.startupId).eq("investorId", userId)
      )
      .first();

    if (existingInvestment) {
      // Update existing investment
      await ctx.db.patch(existingInvestment._id, {
        amount: existingInvestment.amount + args.amount,
        investmentDate: Date.now(),
        notes: args.notes,
      });
    } else {
      // Create new investment
      await ctx.db.insert("investments", {
        startupId: args.startupId,
        investorId: userId,
        amount: args.amount,
        investmentDate: Date.now(),
        notes: args.notes,
      });
    }

    // Record transaction
    await ctx.db.insert("transactions", {
      userId,
      type: "investment",
      amount: args.amount,
      description: `Investment in ${startup.name}`,
      relatedStartupId: args.startupId,
    });

    // Update startup totals
    const allInvestments = await ctx.db
      .query("investments")
      .withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
      .collect();

    const totalInvestments = allInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const investorCount = new Set(allInvestments.map(inv => inv.investorId)).size;

    await ctx.db.patch(args.startupId, {
      totalInvestments,
      investorCount,
    });

    return { success: true };
  },
});

export const getUserInvestments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
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

    return investmentsWithStartups;
  },
});

export const getStartupInvestments = query({
  args: { startupId: v.id("startups") },
  handler: async (ctx, args) => {
    const investments = await ctx.db
      .query("investments")
      .withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
      .collect();

    const investmentsWithInvestors = await Promise.all(
      investments.map(async (investment) => {
        const investor = await ctx.db.get(investment.investorId);
        return {
          ...investment,
          investor,
        };
      })
    );

    return investmentsWithInvestors;
  },
});

export const getUserInvestmentInStartup = query({
  args: { startupId: v.id("startups") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("investments")
      .withIndex("by_startup_and_investor", (q) => 
        q.eq("startupId", args.startupId).eq("investorId", userId)
      )
      .first();
  },
});
