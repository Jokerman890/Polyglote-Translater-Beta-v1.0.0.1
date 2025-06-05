import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Add a term to the user's glossary
export const addGlossaryTerm = mutation({
  args: {
    term: v.string(),
    customTranslation: v.string(),
    sourceLanguage: v.string(),
    targetLanguage: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      term: string;
      customTranslation: string;
      sourceLanguage: string;
      targetLanguage: string;
    }
  ): Promise<Id<"userGlossaries"> | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in to add a glossary term.");
    }

    const normalizedTerm = args.term.trim().toLowerCase();
    const existingTerm = await ctx.db
      .query("userGlossaries")
      .withIndex("by_user_and_languages_and_term", (q) =>
        q
          .eq("userId", userId)
          .eq("sourceLanguage", args.sourceLanguage)
          .eq("targetLanguage", args.targetLanguage)
          .eq("term", normalizedTerm)
      )
      .unique();

    if (existingTerm) {
      console.warn("Term already exists for this language pair, not adding duplicate.");
      return null;
    }

    const glossaryTermId = await ctx.db.insert("userGlossaries", {
      userId,
      term: normalizedTerm,
      customTranslation: args.customTranslation.trim(),
      sourceLanguage: args.sourceLanguage,
      targetLanguage: args.targetLanguage,
    });
    return glossaryTermId;
  },
});

// Update an existing glossary term
export const updateGlossaryTerm = mutation({
  args: {
    glossaryTermId: v.id("userGlossaries"),
    term: v.string(), // Term can be updated
    customTranslation: v.string(), // Translation can be updated
    // Languages are not updatable to keep it simpler; user can delete and re-add for that.
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      glossaryTermId: Id<"userGlossaries">;
      term: string;
      customTranslation: string;
    }
  ): Promise<void> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in to update a glossary term.");
    }

    const existingTermToUpdate = await ctx.db.get(args.glossaryTermId);
    if (!existingTermToUpdate) {
      throw new Error("Glossary term not found.");
    }

    if (existingTermToUpdate.userId !== userId) {
      throw new Error("User is not authorized to update this glossary term.");
    }

    const normalizedNewTerm = args.term.trim().toLowerCase();

    // Check if updating the term would cause a duplicate with another existing entry
    // for the same user and language pair, excluding the current term being updated.
    if (normalizedNewTerm !== existingTermToUpdate.term) {
      const potentialDuplicate = await ctx.db
        .query("userGlossaries")
        .withIndex("by_user_and_languages_and_term", (q) =>
          q
            .eq("userId", userId)
            .eq("sourceLanguage", existingTermToUpdate.sourceLanguage)
            .eq("targetLanguage", existingTermToUpdate.targetLanguage)
            .eq("term", normalizedNewTerm)
        )
        .filter(q => q.neq(q.field("_id"), args.glossaryTermId)) // Exclude the current term itself
        .unique();
      
      if (potentialDuplicate) {
        throw new Error(`An entry for '${args.term}' already exists in this glossary. Please choose a different term.`);
      }
    }
    

    await ctx.db.patch(args.glossaryTermId, {
      term: normalizedNewTerm,
      customTranslation: args.customTranslation.trim(),
    });
  },
});


// Get all glossary terms for the logged-in user and a specific language pair
export const getGlossaryTerms = query({
  args: {
    sourceLanguage: v.string(),
    targetLanguage: v.string(),
  },
  handler: async (
    ctx: QueryCtx,
    args: { sourceLanguage: string; targetLanguage: string }
  ): Promise<Array<Doc<"userGlossaries">>> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("userGlossaries")
      .withIndex("by_user_and_languages", (q) =>
        q
          .eq("userId", userId)
          .eq("sourceLanguage", args.sourceLanguage)
          .eq("targetLanguage", args.targetLanguage)
      )
      .order("asc") // Keep them ordered for consistent display
      .collect();
  },
});

// Delete a glossary term
export const deleteGlossaryTerm = mutation({
  args: {
    glossaryTermId: v.id("userGlossaries"),
  },
  handler: async (ctx: MutationCtx, args: { glossaryTermId: Id<"userGlossaries"> }): Promise<void> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in to delete a glossary term.");
    }

    const termToDelete = await ctx.db.get(args.glossaryTermId);
    if (!termToDelete) {
      throw new Error("Glossary term not found.");
    }

    if (termToDelete.userId !== userId) {
      throw new Error("User is not authorized to delete this glossary term.");
    }

    await ctx.db.delete(args.glossaryTermId);
  },
});

// Internal query to find a specific glossary match for a term
export const getGlossaryMatchForTerm = internalQuery({
  args: {
    userId: v.id("users"),
    term: v.string(),
    sourceLanguage: v.string(),
    targetLanguage: v.string(),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      userId: Id<"users">;
      term: string;
      sourceLanguage: string;
      targetLanguage: string;
    }
  ): Promise<Doc<"userGlossaries"> | null> => {
    const normalizedTerm = args.term.trim().toLowerCase();
    return await ctx.db
      .query("userGlossaries")
      .withIndex("by_user_and_languages_and_term", (q) =>
        q
          .eq("userId", args.userId)
          .eq("sourceLanguage", args.sourceLanguage)
          .eq("targetLanguage", args.targetLanguage)
          .eq("term", normalizedTerm)
      )
      .unique();
  },
});
