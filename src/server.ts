#!/usr/bin/env bun

/**
 * Question API Web Server
 *
 * Provides web UI for viewing questions and statistics.
 * Uses per-category question databases + central registry.
 * Question generation is done via Claude Code CLI using "power up" command.
 *
 * Usage: bun start
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getStats, getQuestions, getTopics, importFromFiles } from './lib/database';
import {
  initRegistry,
  getCategories,
  getSubcategories,
  getTopics as getRegistryTopics,
  getFullHierarchy,
} from './lib/registry';

const PORT = process.env.PORT || 3000;

// Initialize registry on startup
initRegistry();

// ============================================================================
// Server
// ============================================================================

Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API Routes

    // ========== Registry API ==========

    // Get all categories from registry
    if (path === '/api/categories') {
      const categories = getCategories();
      return Response.json(categories, { headers: corsHeaders });
    }

    // Get subcategories (optionally filtered by category)
    if (path === '/api/subcategories') {
      const category = url.searchParams.get('category') || undefined;
      const subcategories = getSubcategories(category);
      return Response.json(subcategories, { headers: corsHeaders });
    }

    // Get full hierarchy (categories → subcategories → topics)
    if (path === '/api/hierarchy') {
      const hierarchy = getFullHierarchy();
      return Response.json(hierarchy, { headers: corsHeaders });
    }

    // ========== Question API ==========

    // Get stats from all category databases
    if (path === '/api/stats') {
      const stats = getStats();
      return Response.json(stats, { headers: corsHeaders });
    }

    // Get questions with filtering
    if (path === '/api/questions') {
      const filters = {
        category: url.searchParams.get('category') || undefined,
        subcategory: url.searchParams.get('subcategory') || undefined,
        topic: url.searchParams.get('topic') || url.searchParams.get('show') || undefined,
        part: url.searchParams.get('part') || url.searchParams.get('season')
          ? parseInt(url.searchParams.get('part') || url.searchParams.get('season')!)
          : undefined,
        chapter: url.searchParams.get('chapter') || url.searchParams.get('episode')
          ? parseInt(url.searchParams.get('chapter') || url.searchParams.get('episode')!)
          : undefined,
        difficulty: url.searchParams.get('difficulty') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '50'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
      };

      const result = getQuestions(filters);

      // Add topic info for frontend compatibility
      const questionsWithTopic = result.questions.map(q => ({
        ...q,
        // Legacy field mapping for frontend
        show: q.topic,
        season: q.part,
        episode: q.chapter,
        topicInfo: {
          category: q.category,
          subcategory: q.subcategory,
          name: q.topic,
          part: q.part,
          chapter: q.chapter,
          title: q.title,
        },
      }));

      return Response.json({ questions: questionsWithTopic, total: result.total }, { headers: corsHeaders });
    }

    // Get topics list from question databases
    if (path === '/api/topics' || path === '/api/tv-shows') {
      const topics = getTopics();
      // Map to include subcategory
      const mapped = topics.map(t => ({
        slug: t.slug,
        name: t.name,
        category: t.category,
        subcategory: t.subcategory,
        seasons: t.parts, // legacy name
        parts: t.parts,
      }));
      return Response.json(mapped, { headers: corsHeaders });
    }

    // Import questions from JSON files to database
    if (path === '/api/import' && req.method === 'POST') {
      const result = importFromFiles();
      const stats = getStats();
      return Response.json({
        success: true,
        ...result,
        total: stats.total
      }, { headers: corsHeaders });
    }

    // Serve static files
    if (path === '/' || path === '/index.html') {
      const html = readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf8');
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }

    if (path === '/stats' || path === '/stats.html') {
      const html = readFileSync(join(process.cwd(), 'public', 'stats.html'), 'utf8');
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }

    if (path === '/questions' || path === '/questions.html') {
      const html = readFileSync(join(process.cwd(), 'public', 'questions.html'), 'utf8');
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }

    if (path === '/registry' || path === '/registry.html') {
      const html = readFileSync(join(process.cwd(), 'public', 'registry.html'), 'utf8');
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }

    // Category detail page: /registry/{category-slug}
    if (path.startsWith('/registry/') && path.split('/').length === 3) {
      const html = readFileSync(join(process.cwd(), 'public', 'category.html'), 'utf8');
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }

    // Try to serve from public folder
    const publicPath = join(process.cwd(), 'public', path);
    if (existsSync(publicPath)) {
      const file = Bun.file(publicPath);
      return new Response(file);
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   📊 Question API Server                                       ║
║                                                                ║
║   Running at: http://localhost:${PORT}                           ║
║                                                                ║
║   Pages:                                                       ║
║   • /           - Home                                         ║
║   • /stats      - Statistics Dashboard                         ║
║   • /questions  - Question Browser                             ║
║   • /registry   - Category/Subcategory Browser                 ║
║                                                                ║
║   Registry API:                                                ║
║   • GET /api/categories     - List all categories              ║
║   • GET /api/subcategories  - List subcategories               ║
║   • GET /api/hierarchy      - Full category tree               ║
║                                                                ║
║   Question API:                                                ║
║   • GET /api/stats          - Aggregated statistics            ║
║   • GET /api/questions      - List questions (with filters)    ║
║   • GET /api/topics         - List topics from questions       ║
║   • POST /api/import        - Import from JSON files           ║
║                                                                ║
║   Databases:                                                   ║
║   • data/registry.db        - Categories, subcategories        ║
║   • data/{category}.db      - Per-category questions           ║
║                                                                ║
║   To generate questions, use Claude Code CLI:                  ║
║   > power up friends s1e10                                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
