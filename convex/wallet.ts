import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getWallet = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return wallet;
  },
});

export const createWallet = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create wallet");
    }

    // Check if wallet already exists
    const existingWallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingWallet) {
      return existingWallet;
    }

    // Create wallet with initial balance
    const walletId = await ctx.db.insert("wallets", {
      userId,
      balance: 100000, // Start with $100k demo money
    });
    
    // Record initial deposit transaction
    await ctx.db.insert("transactions", {
      userId,
      type: "deposit",
      amount: 100000,
      description: "Initial demo balance",
    });

    return await ctx.db.get(walletId);
  },
});

export const deposit = mutation({
  args: {
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to deposit");
    }

    if (args.amount <= 0) {
      throw new Error("Deposit amount must be positive");
    }

    let wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) {
      const walletId = await ctx.db.insert("wallets", {
        userId,
        balance: args.amount,
      });
      wallet = await ctx.db.get(walletId);
    } else {
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + args.amount,
      });
    }

    // Record transaction
    await ctx.db.insert("transactions", {
      userId,
      type: "deposit",
      amount: args.amount,
      description: "Wallet deposit",
    });

    return { success: true };
  },
});

export const withdraw = mutation({
  args: {
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to withdraw");
    }

    if (args.amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
    }

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet || wallet.balance < args.amount) {
      throw new Error("Insufficient funds");
    }

    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.amount,
    });

    // Record transaction
    await ctx.db.insert("transactions", {
      userId,
      type: "withdrawal",
      amount: args.amount,
      description: "Wallet withdrawal",
    });

    return { success: true };
  },
});

export const getTransactions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    const transactionsWithStartups = await Promise.all(
      transactions.map(async (transaction) => {
        if (transaction.relatedStartupId) {
          const startup = await ctx.db.get(transaction.relatedStartupId);
          return {
            ...transaction,
            startup,
          };
        }
        return transaction;
      })
    );

    return transactionsWithStartups;
  },
});
