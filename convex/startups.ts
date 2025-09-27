import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
    stage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("startups")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .paginate(args.paginationOpts);
    } else if (args.stage) {
      return await ctx.db
        .query("startups")
        .withIndex("by_stage", (q) => q.eq("stage", args.stage!))
        .order("desc")
        .paginate(args.paginationOpts);
    }
    
    return await ctx.db
      .query("startups")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const search = query({
  args: {
    searchTerm: v.string(),
    category: v.optional(v.string()),
    stage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("startups").withSearchIndex("search_startups", (q) => {
      let searchQuery = q.search("name", args.searchTerm);
      if (args.category) {
        searchQuery = searchQuery.eq("category", args.category);
      }
      if (args.stage) {
        searchQuery = searchQuery.eq("stage", args.stage);
      }
      return searchQuery;
    });
    
    return await query.take(20);
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const startups = await ctx.db.query("startups").collect();
    const categories = [...new Set(startups.map(s => s.category))];
    return categories.sort();
  },
});

export const getStages = query({
  args: {},
  handler: async (ctx) => {
    const startups = await ctx.db.query("startups").collect();
    const stages = [...new Set(startups.map(s => s.stage))];
    return stages.sort();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    website: v.optional(v.string()),
    category: v.string(),
    stage: v.string(),
    fundingAmount: v.optional(v.number()),
    foundedYear: v.optional(v.number()),
    location: v.optional(v.string()),
    employees: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to add a startup");
    }

    return await ctx.db.insert("startups", {
      ...args,
      submittedBy: userId,
    });
  },
});

export const getById = query({
  args: { id: v.id("startups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("startups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    category: v.optional(v.string()),
    stage: v.optional(v.string()),
    fundingAmount: v.optional(v.number()),
    foundedYear: v.optional(v.number()),
    location: v.optional(v.string()),
    employees: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update a startup");
    }

    const startup = await ctx.db.get(args.id);
    if (!startup) {
      throw new Error("Startup not found");
    }

    if (startup.submittedBy !== userId) {
      throw new Error("Can only update your own startup submissions");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(args.id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("startups") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to delete a startup");
    }

    const startup = await ctx.db.get(args.id);
    if (!startup) {
      throw new Error("Startup not found");
    }

    if (startup.submittedBy !== userId) {
      throw new Error("Can only delete your own startup submissions");
    }

    await ctx.db.delete(args.id);
  },
});
