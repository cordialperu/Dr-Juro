import type { Router } from "express";
import { asyncHandler } from "../lib/http";
import { db } from "../db";
import { notes } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import type { InsertNote } from "@shared/schema";

export function registerNotesRoutes(router: Router) {
  // Obtener todas las notas de un caso
  router.get(
    "/cases/:caseId/notes",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;
      const { pinned, tags } = req.query;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      try {
        const conditions: any[] = [eq(notes.caseId, caseId)];

        // Filtrar por pinned si se solicita
        if (pinned === "true") {
          conditions.push(eq(notes.isPinned, "true"));
        }

        // Filtrar por tags si se proporciona (tags puede ser un string o array)
        if (tags) {
          const tagArray = Array.isArray(tags) ? tags : [tags];
          // Usar operador ?| para buscar si algún tag coincide
          conditions.push(sql`${notes.tags} ?| ARRAY[${sql.join(tagArray.map(t => sql`${t}`), sql`, `)}]`);
        }

        const baseQuery = db.select().from(notes);
        const query = conditions.length ? baseQuery.where(and(...conditions)) : baseQuery;

        const result = await query.orderBy(
          desc(notes.isPinned), // Pinned primero
          desc(notes.updatedAt)
        );

        res.json(result);
      } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ error: "Failed to fetch notes" });
      }
    })
  );

  // Crear una nueva nota
  router.post(
    "/cases/:caseId/notes",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;
      const userId = req.session?.userId;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        const noteData: InsertNote = {
          caseId,
          title: req.body.title,
          content: req.body.content,
          tags: req.body.tags || [],
          isPinned: req.body.isPinned || "false",
          createdBy: userId,
        };

        const [newNote] = await db.insert(notes).values(noteData).returning();

        res.status(201).json(newNote);
      } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ error: "Failed to create note" });
      }
    })
  );

  // Actualizar una nota
  router.patch(
    "/notes/:noteId",
    asyncHandler(async (req, res) => {
      const { noteId } = req.params;
      const userId = req.session?.userId;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        const updateData: Partial<InsertNote> = {};

        if (req.body.title !== undefined) updateData.title = req.body.title;
        if (req.body.content !== undefined) updateData.content = req.body.content;
        if (req.body.tags !== undefined) updateData.tags = req.body.tags;
        if (req.body.isPinned !== undefined) updateData.isPinned = req.body.isPinned;

        const [updatedNote] = await db
          .update(notes)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(notes.id, noteId))
          .returning();

        if (!updatedNote) {
          return res.status(404).json({ error: "Note not found" });
        }

        res.json(updatedNote);
      } catch (error) {
        console.error("Error updating note:", error);
        res.status(500).json({ error: "Failed to update note" });
      }
    })
  );

  // Toggle pin de una nota
  router.patch(
    "/notes/:noteId/toggle-pin",
    asyncHandler(async (req, res) => {
      const { noteId } = req.params;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      try {
        // Obtener estado actual
        const [currentNote] = await db.select().from(notes).where(eq(notes.id, noteId));

        if (!currentNote) {
          return res.status(404).json({ error: "Note not found" });
        }

        const newPinnedState = currentNote.isPinned === "true" ? "false" : "true";

        const [updatedNote] = await db
          .update(notes)
          .set({
            isPinned: newPinnedState,
            updatedAt: new Date(),
          })
          .where(eq(notes.id, noteId))
          .returning();

        res.json(updatedNote);
      } catch (error) {
        console.error("Error toggling pin:", error);
        res.status(500).json({ error: "Failed to toggle pin" });
      }
    })
  );

  // Eliminar una nota
  router.delete(
    "/notes/:noteId",
    asyncHandler(async (req, res) => {
      const { noteId } = req.params;
      const userId = req.session?.userId;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        await db.delete(notes).where(eq(notes.id, noteId));
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ error: "Failed to delete note" });
      }
    })
  );

  // Buscar notas (full-text search)
  router.get(
    "/cases/:caseId/notes/search",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;
      const { q, tags } = req.query;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query required" });
      }

      try {
        // Usar la función search_notes del SQL
        const tagArray = tags ? (Array.isArray(tags) ? tags : [tags]) : null;
        
        const result = await db.execute(sql`
          SELECT * FROM search_notes(
            ${q}::TEXT,
            ${caseId}::VARCHAR,
            ${tagArray ? sql`ARRAY[${sql.join(tagArray.map(t => sql`${t}`), sql`, `)}]` : null}
          )
        `);

        res.json(result.rows);
      } catch (error) {
        console.error("Error searching notes:", error);
        res.status(500).json({ error: "Failed to search notes" });
      }
    })
  );

  // Obtener tags únicos de un caso
  router.get(
    "/cases/:caseId/notes/tags",
    asyncHandler(async (req, res) => {
      const { caseId } = req.params;

      if (!db) {
        return res.status(503).json({ error: "Database not configured" });
      }

      try {
        const result = await db.execute(sql`
          SELECT DISTINCT jsonb_array_elements_text(tags) as tag
          FROM notes
          WHERE case_id = ${caseId}
          ORDER BY tag
        `);

        const tags = result.rows.map((row: any) => row.tag);
        res.json(tags);
      } catch (error) {
        console.error("Error fetching tags:", error);
        res.status(500).json({ error: "Failed to fetch tags" });
      }
    })
  );
}
