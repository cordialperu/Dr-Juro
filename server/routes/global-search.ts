import type { Router } from "express";
import { db } from "../db";
import { notes, caseDocuments } from "../../shared/schema";
import { eq, sql, and } from "drizzle-orm";

interface SearchResult {
  type: "note" | "document";
  id: string;
  title: string;
  content: string;
  preview: string;
  relevance: number;
  metadata?: Record<string, any>;
}

export function registerGlobalSearchRoutes(router: Router) {
  // Global search in case context
  router.get("/cases/:caseId/search", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
      }

      const { caseId } = req.params;
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const searchQuery = q.trim();
      if (searchQuery.length < 2) {
        return res.json({ results: [] });
      }

      const results: SearchResult[] = [];

      // Search in notes using full-text search
      const notesResults = await db!
        .select({
          id: notes.id,
          title: notes.title,
          content: notes.content,
          tags: notes.tags,
          createdAt: notes.createdAt,
          rank: sql<number>`ts_rank(to_tsvector('spanish', ${notes.title} || ' ' || ${notes.content}), plainto_tsquery('spanish', ${searchQuery}))`,
        })
        .from(notes)
        .where(
          and(
            eq(notes.caseId, caseId),
            sql`to_tsvector('spanish', ${notes.title} || ' ' || ${notes.content}) @@ plainto_tsquery('spanish', ${searchQuery})`
          )
        )
        .orderBy(sql`ts_rank DESC`)
        .limit(10);

      notesResults.forEach((note) => {
        const preview = note.content.substring(0, 200);
        results.push({
          type: "note",
          id: note.id,
          title: note.title,
          content: note.content,
          preview: preview + (note.content.length > 200 ? "..." : ""),
          relevance: note.rank,
          metadata: {
            tags: note.tags,
            createdAt: note.createdAt,
          },
        });
      });

      // Search in documents (OCR content)
      const documentsResults = await db!
        .select({
          id: caseDocuments.id,
          filename: caseDocuments.filename,
          content: caseDocuments.content,
          fileType: caseDocuments.fileType,
          createdAt: caseDocuments.createdAt,
          rank: sql<number>`COALESCE(ts_rank(to_tsvector('spanish', COALESCE(${caseDocuments.content}, '')), plainto_tsquery('spanish', ${searchQuery})), 0)`,
        })
        .from(caseDocuments)
        .where(
          and(
            eq(caseDocuments.caseId, caseId),
            sql`${caseDocuments.content} IS NOT NULL AND ${caseDocuments.content} != ''`,
            sql`to_tsvector('spanish', COALESCE(${caseDocuments.content}, '')) @@ plainto_tsquery('spanish', ${searchQuery})`
          )
        )
        .orderBy(sql`rank DESC`)
        .limit(10);

      documentsResults.forEach((doc) => {
        const content = doc.content || "";
        const preview = content.substring(0, 200);
        results.push({
          type: "document",
          id: doc.id,
          title: doc.filename,
          content: content,
          preview: preview + (content.length > 200 ? "..." : ""),
          relevance: doc.rank,
          metadata: {
            fileType: doc.fileType,
            createdAt: doc.createdAt,
          },
        });
      });

      // Sort all results by relevance
      results.sort((a, b) => b.relevance - a.relevance);

      res.json({ results, query: searchQuery, total: results.length });
    } catch (error: any) {
      console.error("Error in global search:", error);
      res.status(500).json({
        message: "Error al buscar",
        error: error.message,
      });
    }
  });
}
