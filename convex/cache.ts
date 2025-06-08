import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Internal query to get from cache
export const getTranslationFromCache = internalQuery({
  args: {
    originalTextSHA256: v.string(),
    sourceLanguage: v.string(), // Added
    targetLanguage: v.string(),
  },
  handler: async (
    ctx: QueryCtx,
    args: { originalTextSHA256: string; sourceLanguage: string; targetLanguage: string } // Updated args type
  ): Promise<Doc<"translationsCache"> | null> => {
    const result = await ctx.db
      .query("translationsCache")
      .withIndex("by_original_text_sha256_and_source_and_target_language", (q) => // Index name updated
        q.eq("originalTextSHA256", args.originalTextSHA256)
         .eq("sourceLanguage", args.sourceLanguage) // Added sourceLanguage condition
         .eq("targetLanguage", args.targetLanguage)
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
    sourceLanguage: v.string(), // Added
    targetLanguage: v.string(),
    translatedText: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      originalTextSHA256: string;
      originalText: string;
      sourceLanguage: string; // Updated args type
      targetLanguage: string;
      translatedText: string;
    }
  ): Promise<void> => {
    await ctx.db.insert("translationsCache", {
      originalTextSHA256: args.originalTextSHA256,
      originalText: args.originalText,
      sourceLanguage: args.sourceLanguage, // Added
      targetLanguage: args.targetLanguage,
      translatedText: args.translatedText,
    });
  },
});
