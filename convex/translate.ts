"use node";

import OpenAI from "openai";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import crypto from "node:crypto";
import { Doc, Id } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

async function sha256(text: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  hash.update(text);
  return hash.digest('hex');
}

export const translateText = action({
  args: {
    text: v.string(),
    sourceLanguage: v.string(),
    targetLanguage: v.string(),
  },
  handler: async (
    ctx: ActionCtx,
    args: { text: string; sourceLanguage: string; targetLanguage: string }
  ): Promise<string | null> => {
    if (!args.text.trim()) {
      return null;
    }

    const textToTranslate = args.text.trim();
    const userId: Id<"users"> | null = await getAuthUserId(ctx);

    // 1. Check user's glossary if logged in
    if (userId) {
      const glossaryMatch: Doc<"userGlossaries"> | null = await ctx.runQuery(
        internal.glossary.getGlossaryMatchForTerm,
        {
          userId,
          term: textToTranslate,
          sourceLanguage: args.sourceLanguage,
          targetLanguage: args.targetLanguage,
        }
      );
      if (glossaryMatch) {
        console.log("Glossary hit!");
        return glossaryMatch.customTranslation;
      }
    }

    // 2. Check general cache
    const cacheKeyString = `${textToTranslate.toLowerCase()}|${args.sourceLanguage.toLowerCase()}|${args.targetLanguage.toLowerCase()}`;
    const originalTextSHA256 = await sha256(cacheKeyString);

    const cached: Doc<"translationsCache"> | null = await ctx.runQuery(
      internal.cache.getTranslationFromCache,
      {
        originalTextSHA256,
        sourceLanguage: args.sourceLanguage, // Added
        targetLanguage: args.targetLanguage,
      }
    );

    if (cached) {
      console.log("General cache hit!");
      return cached.translatedText;
    }

    console.log("Cache miss (general and glossary), calling API.");
    // 3. If not in cache or glossary, call API
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful translation assistant. Translate the given text from ${args.sourceLanguage} to ${args.targetLanguage}. Only provide the translated text, without any additional explanations or conversational phrases.`,
          },
          { role: "user", content: textToTranslate },
        ],
      });
      const translatedText = completion.choices[0].message.content;

      if (translatedText) {
        // 4. Store in general cache
        await ctx.runMutation(internal.cache.storeTranslationInCache, {
          originalTextSHA256,
          originalText: textToTranslate,
          sourceLanguage: args.sourceLanguage, // Added
          targetLanguage: args.targetLanguage,
          translatedText,
        });

        // 5. Record usage if user is logged in and translation was from API
        if (userId) {
          await ctx.runMutation(internal.usage.recordTranslationUsage, {
            userId,
            characterCount: textToTranslate.length, // Count characters of the original text
          });
        }
        return translatedText;
      } else {
        throw new Error("Translation API returned empty content.");
      }
    } catch (error) {
      console.error("Error translating text or caching:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to translate text: ${error.message}`);
      }
      throw new Error("An unknown error occurred during translation.");
    }
  },
});
