import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  translationsCache: defineTable({
    originalTextSHA256: v.string(),
    originalText: v.string(),
  sourceLanguage: v.string(), // Added
    targetLanguage: v.string(),
    translatedText: v.string(),
}).index("by_original_text_sha256_and_source_and_target_language", ["originalTextSHA256", "sourceLanguage", "targetLanguage"]), // Index name and fields updated

  userGlossaries: defineTable({
    userId: v.id("users"),
    term: v.string(),
    customTranslation: v.string(),
    sourceLanguage: v.string(),
    targetLanguage: v.string(),
  })
    .index("by_user_and_languages_and_term", ["userId", "sourceLanguage", "targetLanguage", "term"])
    .index("by_user_and_languages", ["userId", "sourceLanguage", "targetLanguage"]),

  userMonthlyUsage: defineTable({
    userId: v.id("users"),
    month: v.string(), // Format: "YYYY-MM"
    translatedCharacters: v.number(),
  }).index("by_user_and_month", ["userId", "month"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
