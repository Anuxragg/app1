import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  startups: defineTable({
    name: v.string(),
    description: v.string(),
    website: v.optional(v.string()),
    category: v.string(),
    stage: v.string(), // "Pre-seed", "Seed", "Series A", "Series B", etc.
    fundingAmount: v.optional(v.number()),
    foundedYear: v.optional(v.number()),
    location: v.optional(v.string()),
    employees: v.optional(v.string()), // "1-10", "11-50", "51-200", etc.
    logoUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    submittedBy: v.id("users"),
    valuation: v.optional(v.number()),
    totalInvestments: v.optional(v.number()),
    investorCount: v.optional(v.number()),
    isTopStartup: v.optional(v.boolean()),
  })
    .index("by_category", ["category"])
    .index("by_stage", ["stage"])
    .index("by_submitter", ["submittedBy"])
    .index("by_top_startup", ["isTopStartup"])
    .searchIndex("search_startups", {
      searchField: "name",
      filterFields: ["category", "stage"],
    }),
  
  investments: defineTable({
    startupId: v.id("startups"),
    investorId: v.id("users"),
    amount: v.number(),
    investmentDate: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_startup", ["startupId"])
    .index("by_investor", ["investorId"])
    .index("by_startup_and_investor", ["startupId", "investorId"]),

  wallets: defineTable({
    userId: v.id("users"),
    balance: v.number(),
  })
    .index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.string(), // "deposit", "withdrawal", "investment"
    amount: v.number(),
    description: v.string(),
    relatedStartupId: v.optional(v.id("startups")),
  })
    .index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
