import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Internal query to get from cache
export const getTranslationFromCache = internalQuery({
  args: {
    originalTextSHA256: v.string(),
    targetLanguage: v.string(),
  },
  handler: async (
    ctx: QueryCtx,
    args: { originalTextSHA256: string; targetLanguage: string }
  ): Promise<Doc<"translationsCache"> | null> => {
    const result = await ctx.db
      .query("translationsCache")
      .withIndex("by_original_text_sha256_and_target_language", (q) =>
        q.eq("originalTextSHA256", args.originalTextSHA256).eq("targetLanguage", args.targetLanguage)
      )
      .unique();
    return result;
  },
});

// Internal mutation to store in cache
export const storeTranslationInCache = internalMutation({
  args: {
    originalTextSHA256: v.string(),
    originalText: v.string(),
    targetLanguage: v.string(),
    translatedText: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      originalTextSHA256: string;
      originalText: string;
      targetLanguage: string;
      translatedText: string;
    }
  ): Promise<void> => {
    await ctx.db.insert("translationsCache", {
      originalTextSHA256: args.originalTextSHA256,
      originalText: args.originalText,
      targetLanguage: args.targetLanguage,
      translatedText: args.translatedText,
    });
  },
});
