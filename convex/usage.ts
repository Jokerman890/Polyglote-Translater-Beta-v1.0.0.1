import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current month in YYYY-MM format
function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  return `${year}-${month}`;
}

// Internal mutation to record translation usage
export const recordTranslationUsage = internalMutation({
  args: {
    userId: v.id("users"),
    characterCount: v.number(),
  },
  handler: async (
    ctx: MutationCtx,
    args: { userId: Id<"users">; characterCount: number }
  ): Promise<void> => {
    if (args.characterCount <= 0) return;

    const monthStr = getCurrentMonthString();

    const existingUsage = await ctx.db
      .query("userMonthlyUsage")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", args.userId).eq("month", monthStr)
      )
      .unique();

    if (existingUsage) {
      await ctx.db.patch(existingUsage._id, {
        translatedCharacters: existingUsage.translatedCharacters + args.characterCount,
      });
    } else {
      await ctx.db.insert("userMonthlyUsage", {
        userId: args.userId,
        month: monthStr,
        translatedCharacters: args.characterCount,
      });
    }
  },
});

// Public query to get current month's usage for the logged-in user
export const getCurrentMonthUsage = query({
  args: {},
  handler: async (ctx: QueryCtx): Promise<{ month: string; translatedCharacters: number } | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null; // Or throw error, depending on how you want to handle unauthenticated access
    }

    const monthStr = getCurrentMonthString();
    const usage = await ctx.db
      .query("userMonthlyUsage")
      .withIndex("by_user_and_month", (q) =>
        q.eq("userId", userId).eq("month", monthStr)
      )
      .unique();

    if (usage) {
      return { month: usage.month, translatedCharacters: usage.translatedCharacters };
    } else {
      // No usage recorded for this month yet
      return { month: monthStr, translatedCharacters: 0 };
    }
  },
});
