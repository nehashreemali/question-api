#!/usr/bin/env bun

/**
 * Question Generator Web Server
 *
 * Provides a web UI for generating quiz questions with real-time updates.
 *
 * Usage: bun start
 */

import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fetchContent } from './lib/adapters/index';
import type { ContentResult } from './lib/adapters/types';

const PORT = process.env.PORT || 3000;
const REGISTRY_PATH = join(process.cwd(), 'data-generation', 'registry.json');
const DATA_PATH = join(process.cwd(), 'data');
const TV_DATA_PATH = join(process.cwd(), 'data', 'tv-shows');

// Depth tier to question count mapping
const DEPTH_QUESTION_COUNT: Record<string, number> = {
  limited: 30,
  medium: 75,
  large: 150,
  massive: 350,
  immense: 750,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getRegistry() {
  return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
}

function getStats() {
  const registry = getRegistry();
  const stats = {
    totalTopics: 0,
    totalGenerated: 0,
    totalQuestions: 0,
    byCategory: {} as Record<string, { total: number; generated: number; questions: number }>,
    byDepth: { limited: 0, medium: 0, large: 0, massive: 0, immense: 0 },
  };

  for (const [catKey, cat] of Object.entries(registry.categories) as [string, any][]) {
    stats.byCategory[catKey] = { total: 0, generated: 0, questions: 0 };

    for (const [subKey, sub] of Object.entries(cat.subcategories || {}) as [string, any][]) {
      for (const [topicKey, topic] of Object.entries(sub.topics || {}) as [string, any][]) {
        stats.totalTopics++;
        stats.byCategory[catKey].total++;

        if (topic.depth) {
          stats.byDepth[topic.depth as keyof typeof stats.byDepth]++;
        }

        // Check if questions exist
        const questionsPath = join(DATA_PATH, catKey, topicKey, 'questions.json');
        if (existsSync(questionsPath)) {
          try {
            const questions = JSON.parse(readFileSync(questionsPath, 'utf8'));
            const count = questions.questionCount || questions.questions?.length || 0;
            stats.totalGenerated++;
            stats.totalQuestions += count;
            stats.byCategory[catKey].generated++;
            stats.byCategory[catKey].questions += count;
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }

  return stats;
}

function getTopicsWithStatus() {
  const registry = getRegistry();
  const topics: any[] = [];

  for (const [catKey, cat] of Object.entries(registry.categories) as [string, any][]) {
    for (const [subKey, sub] of Object.entries(cat.subcategories || {}) as [string, any][]) {
      for (const [topicKey, topic] of Object.entries(sub.topics || {}) as [string, any][]) {
        const questionsPath = join(DATA_PATH, catKey, topicKey, 'questions.json');
        let questionCount = 0;
        let generatedAt = null;

        if (existsSync(questionsPath)) {
          try {
            const data = JSON.parse(readFileSync(questionsPath, 'utf8'));
            questionCount = data.questionCount || data.questions?.length || 0;
            generatedAt = data.generatedAt;
          } catch (e) {}
        }

        topics.push({
          category: catKey,
          categoryName: cat.name,
          subcategory: subKey,
          subcategoryName: sub.name,
          topic: topicKey,
          name: topic.name,
          depth: topic.depth || 'medium',
          questionCount,
          generatedAt,
          targetCount: DEPTH_QUESTION_COUNT[topic.depth || 'medium'],
        });
      }
    }
  }

  return topics;
}

function getRecentlyGenerated(limit = 10) {
  const topics = getTopicsWithStatus()
    .filter(t => t.generatedAt)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    .slice(0, limit);

  return topics;
}

// ============================================================================
// Questions Scanner (for new folder structure)
// ============================================================================

interface QuestionStats {
  total: number;
  byGenerator: {
    groq: number;
    claudeCode: number;
  };
  byCategory: Record<string, { total: number; groq: number; claudeCode: number }>;
  byShow: Record<string, { total: number; groq: number; claudeCode: number; seasons: Record<string, number> }>;
  byDifficulty: { easy: number; medium: number; hard: number };
}

function scanAllQuestions(): QuestionStats {
  const stats: QuestionStats = {
    total: 0,
    byGenerator: { groq: 0, claudeCode: 0 },
    byCategory: {},
    byShow: {},
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
  };

  // Scan TV shows
  if (existsSync(TV_DATA_PATH)) {
    const shows = readdirSync(TV_DATA_PATH, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const show of shows) {
      const showPath = join(TV_DATA_PATH, show.name);
      stats.byShow[show.name] = { total: 0, groq: 0, claudeCode: 0, seasons: {} };

      const seasons = readdirSync(showPath, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name.startsWith('season-'));

      for (const season of seasons) {
        const seasonPath = join(showPath, season.name);
        const seasonNum = season.name.replace('season-', '');
        stats.byShow[show.name].seasons[seasonNum] = 0;

        const episodes = readdirSync(seasonPath, { withFileTypes: true })
          .filter(d => d.isDirectory() && d.name.startsWith('episode-'));

        for (const episode of episodes) {
          const questionsDir = join(seasonPath, episode.name, 'questions');
          if (!existsSync(questionsDir)) continue;

          const files = readdirSync(questionsDir)
            .filter(f => f.endsWith('.json') && !f.includes('raw_questions'));

          for (const file of files) {
            try {
              const data = JSON.parse(readFileSync(join(questionsDir, file), 'utf8'));
              const questions = data.questions || [];
              const isGroq = file.startsWith('groq_');
              const isClaude = file.startsWith('claude_code_');

              for (const q of questions) {
                stats.total++;
                stats.byShow[show.name].total++;
                stats.byShow[show.name].seasons[seasonNum]++;

                if (isGroq || q.generatedBy === 'groq') {
                  stats.byGenerator.groq++;
                  stats.byShow[show.name].groq++;
                } else if (isClaude || q.generatedBy === 'claude-code') {
                  stats.byGenerator.claudeCode++;
                  stats.byShow[show.name].claudeCode++;
                }

                const diff = q.difficulty || 'medium';
                if (diff in stats.byDifficulty) {
                  stats.byDifficulty[diff as keyof typeof stats.byDifficulty]++;
                }
              }
            } catch (e) {
              // Skip invalid files
            }
          }
        }
      }

      // Add to category stats
      if (!stats.byCategory['tv-shows']) {
        stats.byCategory['tv-shows'] = { total: 0, groq: 0, claudeCode: 0 };
      }
      stats.byCategory['tv-shows'].total += stats.byShow[show.name].total;
      stats.byCategory['tv-shows'].groq += stats.byShow[show.name].groq;
      stats.byCategory['tv-shows'].claudeCode += stats.byShow[show.name].claudeCode;
    }
  }

  return stats;
}

interface QuestionWithMeta {
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
  explanation?: string;
  topic: {
    type: string;
    show?: string;
    season?: number;
    episode?: number;
    title?: string;
    category?: string;
  };
  generatedBy: string;
  generatedAt?: string;
}

function getAllQuestions(filters?: {
  category?: string;
  show?: string;
  season?: number;
  generator?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}): { questions: QuestionWithMeta[]; total: number } {
  const allQuestions: QuestionWithMeta[] = [];

  // Scan TV shows
  if (existsSync(TV_DATA_PATH)) {
    const shows = readdirSync(TV_DATA_PATH, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const show of shows) {
      if (filters?.show && show.name !== filters.show) continue;

      const showPath = join(TV_DATA_PATH, show.name);
      const seasons = readdirSync(showPath, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name.startsWith('season-'));

      for (const season of seasons) {
        const seasonNum = parseInt(season.name.replace('season-', ''));
        if (filters?.season && seasonNum !== filters.season) continue;

        const seasonPath = join(showPath, season.name);
        const episodes = readdirSync(seasonPath, { withFileTypes: true })
          .filter(d => d.isDirectory() && d.name.startsWith('episode-'));

        for (const episode of episodes) {
          const questionsDir = join(seasonPath, episode.name, 'questions');
          if (!existsSync(questionsDir)) continue;

          const files = readdirSync(questionsDir)
            .filter(f => f.endsWith('.json') && !f.includes('raw_questions'));

          for (const file of files) {
            const isGroq = file.startsWith('groq_');
            const isClaude = file.startsWith('claude_code_');
            const generator = isGroq ? 'groq' : isClaude ? 'claude-code' : 'unknown';

            if (filters?.generator && generator !== filters.generator) continue;

            try {
              const data = JSON.parse(readFileSync(join(questionsDir, file), 'utf8'));
              const questions = data.questions || [];

              for (const q of questions) {
                if (filters?.difficulty && q.difficulty !== filters.difficulty) continue;

                allQuestions.push({
                  ...q,
                  topic: q.topic || {
                    type: 'tv-show',
                    show: show.name,
                    season: seasonNum,
                    episode: parseInt(episode.name.replace('episode-', '')),
                    title: data.title,
                  },
                  generatedBy: q.generatedBy || generator,
                  generatedAt: q.generatedAt || data.generatedAt,
                });
              }
            } catch (e) {
              // Skip invalid files
            }
          }
        }
      }
    }
  }

  const total = allQuestions.length;
  const offset = filters?.offset || 0;
  const limit = filters?.limit || 50;

  return {
    questions: allQuestions.slice(offset, offset + limit),
    total,
  };
}

// ============================================================================
// TV Show Helpers
// ============================================================================

function getTVShows() {
  const registry = getRegistry();
  const tvCategory = registry.categories['tv-shows'];
  if (!tvCategory) return [];

  const shows: any[] = [];
  for (const [subKey, sub] of Object.entries(tvCategory.subcategories || {}) as [string, any][]) {
    for (const [topicKey, topic] of Object.entries(sub.topics || {}) as [string, any][]) {
      const showPath = join(TV_DATA_PATH, topicKey);
      const hasTranscripts = existsSync(showPath);

      // Get season info if transcripts exist
      let seasons: number[] = [];
      if (hasTranscripts) {
        const entries = readdirSync(showPath, { withFileTypes: true });
        seasons = entries
          .filter(e => e.isDirectory() && e.name.startsWith('season-'))
          .map(e => parseInt(e.name.replace('season-', '')))
          .sort((a, b) => a - b);
      }

      shows.push({
        slug: topicKey,
        name: topic.name,
        subcategory: subKey,
        subcategoryName: sub.name,
        hasTranscripts,
        seasons,
        depth: topic.depth || 'medium',
      });
    }
  }

  return shows;
}

function getTVShowSeasons(showSlug: string) {
  const showPath = join(TV_DATA_PATH, showSlug);
  if (!existsSync(showPath)) return [];

  const entries = readdirSync(showPath, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && e.name.startsWith('season-'))
    .map(e => parseInt(e.name.replace('season-', '')))
    .sort((a, b) => a - b);
}

function getTVShowEpisodes(showSlug: string, season: number) {
  const seasonPath = join(TV_DATA_PATH, showSlug, `season-${season}`);
  if (!existsSync(seasonPath)) return [];

  const entries = readdirSync(seasonPath, { withFileTypes: true });
  const episodes: any[] = [];

  for (const e of entries) {
    if (e.isDirectory() && e.name.startsWith('episode-')) {
      const episodeNum = parseInt(e.name.replace('episode-', ''));
      const transcriptPath = join(seasonPath, e.name, 'transcript.json');
      const hasTranscript = existsSync(transcriptPath);

      let title = `Episode ${episodeNum}`;
      if (hasTranscript) {
        try {
          const data = JSON.parse(readFileSync(transcriptPath, 'utf8'));
          title = data.title || title;
        } catch (e) {}
      }

      episodes.push({
        episode: episodeNum,
        title,
        hasTranscript,
      });
    }
  }

  return episodes.sort((a, b) => a.episode - b.episode);
}

function getTranscriptStatus(showSlug: string, season: number, episode: number) {
  const transcriptPath = join(TV_DATA_PATH, showSlug, `season-${season}`, `episode-${episode}`, 'transcript.json');

  if (!existsSync(transcriptPath)) {
    return { exists: false };
  }

  try {
    const data = JSON.parse(readFileSync(transcriptPath, 'utf8'));
    return {
      exists: true,
      title: data.title,
      wordCount: data.transcript?.split(/\s+/).length || 0,
      source: data.source || 'Unknown',
    };
  } catch (e) {
    return { exists: false };
  }
}

async function scrapeTranscript(showSlug: string, showName: string, season: number, episode: number) {
  // Try subslikescript.com first
  const searchQuery = `${showName} season ${season} episode ${episode} transcript`;
  const subslikeUrl = `https://subslikescript.com/series/${showName.replace(/\s+/g, '_')}-${season}x${episode.toString().padStart(2, '0')}`;

  let transcript = '';
  let title = `Season ${season} Episode ${episode}`;
  let source = '';
  let sourceUrl = '';

  // Try to fetch from subslikescript
  try {
    const response = await fetch(subslikeUrl);
    if (response.ok) {
      const html = await response.text();
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);

      // Extract transcript
      const fullTranscript = $('.full-script').text().trim();
      if (fullTranscript && fullTranscript.length > 500) {
        transcript = fullTranscript;
        title = $('h1').first().text().trim() || title;
        source = 'Subslikescript';
        sourceUrl = subslikeUrl;
      }
    }
  } catch (e) {
    // Continue to fallback
  }

  // Fallback: Try alternative URL format
  if (!transcript) {
    try {
      const altUrl = `https://subslikescript.com/series/${encodeURIComponent(showName.toLowerCase().replace(/\s+/g, '-'))}/season-${season}/episode-${episode}`;
      const response = await fetch(altUrl);
      if (response.ok) {
        const html = await response.text();
        const cheerio = await import('cheerio');
        const $ = cheerio.load(html);

        const fullTranscript = $('.full-script').text().trim();
        if (fullTranscript && fullTranscript.length > 500) {
          transcript = fullTranscript;
          title = $('h1').first().text().trim() || title;
          source = 'Subslikescript';
          sourceUrl = altUrl;
        }
      }
    } catch (e) {
      // Continue
    }
  }

  if (!transcript) {
    throw new Error(`Could not find transcript for ${showName} S${season}E${episode}. Try adding it manually.`);
  }

  // Save the transcript
  const episodePath = join(TV_DATA_PATH, showSlug, `season-${season}`, `episode-${episode}`);
  mkdirSync(episodePath, { recursive: true });

  const transcriptData = {
    show: showName,
    season,
    episode,
    title,
    transcript,
    formattedTranscript: transcript,
    source,
    sourceUrl,
    scrapedAt: new Date().toISOString(),
  };

  writeFileSync(join(episodePath, 'transcript.json'), JSON.stringify(transcriptData, null, 2));

  return transcriptData;
}

// ============================================================================
// Question Generation (adapted from generate.ts)
// ============================================================================

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

function buildPrompt(content: ContentResult, category: string, questionsCount: number, existingQuestions: Question[] = []): string {
  const isSports = category === 'sports';
  const isEpic = content.title.toLowerCase().includes('mahabharata') ||
                 content.title.toLowerCase().includes('ramayana') ||
                 content.title.toLowerCase().includes('gita');

  let categorySpecificInstructions = '';

  if (isSports) {
    categorySpecificInstructions = `
**SPORTS-SPECIFIC RULES:**
- Include questions about records, statistics, and historical facts
- For time-sensitive stats, the data is accurate as of: ${content.asOfDate || 'recent'}
- Mix questions about: tournaments, players, records, rules, history
- Avoid questions that might become outdated quickly (use historical facts)
`;
  } else if (isEpic) {
    categorySpecificInstructions = `
**EPIC/SCRIPTURE-SPECIFIC RULES:**
- Focus on major characters, stories, teachings, and events
- Include questions about: main characters, key events, moral teachings, relationships
- Avoid obscure details that only scholars would know
- Make questions educational and culturally respectful
- Include a mix of narrative (what happened) and philosophical (teachings) questions
`;
  } else if (category === 'science' || category === 'mathematics') {
    categorySpecificInstructions = `
**SCIENCE/EDUCATION-SPECIFIC RULES:**
- Focus on fundamental concepts and principles
- Include questions about: definitions, laws, formulas, discoveries, scientists
- Avoid overly technical jargon - make it accessible
- Include practical applications where relevant
`;
  }

  let existingQuestionsSection = '';
  if (existingQuestions.length > 0) {
    const existingList = existingQuestions.map(q => `- ${q.question}`).join('\n');
    existingQuestionsSection = `
**EXISTING QUESTIONS (DO NOT DUPLICATE THESE):**
${existingList}

`;
  }

  return `You are an expert quiz question generator. Generate ${questionsCount} high-quality multiple-choice questions from the following content.

**Topic:** ${content.title}
**Category:** ${category}
**Source:** ${content.source}

${categorySpecificInstructions}
${existingQuestionsSection}
**CRITICAL REQUIREMENTS:**

1. **Question Quality Standards:**
   - Questions must be based ONLY on the provided content
   - Each question should have ONE clearly correct answer
   - Wrong answers should be plausible but definitively incorrect
   - Avoid vague or ambiguous questions
   ${existingQuestions.length > 0 ? '- DO NOT repeat or rephrase any existing questions listed above' : ''}

2. **Difficulty Distribution (${questionsCount} total):**
   - **Easy (40%):** Basic facts, main concepts, well-known information
   - **Medium (40%):** Specific details, connections between concepts
   - **Hard (20%):** Nuanced understanding, lesser-known facts

3. **Format Rules:**
   - Exactly 4 options per question
   - Options should be similar in length and structure
   - Avoid "All of the above" or "None of the above"
   - Correct answer must be verbatim one of the options
   - Include brief, factual explanations

**Content:**
${content.content.substring(0, 25000)}

**Output Format (JSON only, no other text):**
{
  "questions": [
    {
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "correct_answer": "exact match to one option",
      "difficulty": "easy|medium|hard",
      "explanation": "brief factual explanation with source reference"
    }
  ]
}`;
}

async function callClaudeAPI(prompt: string): Promise<Question[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
      system: 'You are a professional quiz question generator. Generate high-quality, accurate questions. Return ONLY valid JSON with no additional text or markdown formatting.',
    }),
  });

  const data = await response.json() as any;
  const content = data.content[0].text;
  const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(jsonStr).questions;
}

async function callGroqAPI(prompt: string): Promise<Question[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a professional quiz question generator. Generate high-quality, accurate questions. Return ONLY valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json() as any;
  return JSON.parse(data.choices[0].message.content).questions;
}

// ============================================================================
// SSE Generation Handler
// ============================================================================

async function* generateQuestionsSSE(category: string, subcategory: string, topic: string, season?: number, episode?: number) {
  const registry = getRegistry();
  const catData = registry.categories[category];
  if (!catData) {
    yield { type: 'error', message: `Category "${category}" not found` };
    return;
  }

  const subData = catData.subcategories?.[subcategory];
  if (!subData) {
    yield { type: 'error', message: `Subcategory "${subcategory}" not found` };
    return;
  }

  const topicData = subData.topics?.[topic];
  if (!topicData) {
    yield { type: 'error', message: `Topic "${topic}" not found` };
    return;
  }

  const depth = topicData.depth || 'medium';
  const targetCount = DEPTH_QUESTION_COUNT[depth];

  yield { type: 'status', message: 'Starting generation...', step: 1, totalSteps: 5 };

  // Load existing questions
  const questionsPath = join(DATA_PATH, category, topic, 'questions.json');
  let existingQuestions: Question[] = [];
  let existingData: any = null;

  if (existsSync(questionsPath)) {
    try {
      existingData = JSON.parse(readFileSync(questionsPath, 'utf8'));
      existingQuestions = existingData.questions || [];
      yield { type: 'info', message: `Found ${existingQuestions.length} existing questions` };
    } catch (e) {}
  }

  const questionsToGenerate = Math.max(0, targetCount - existingQuestions.length);

  if (questionsToGenerate === 0) {
    yield { type: 'complete', message: `Already have ${existingQuestions.length} questions (target: ${targetCount})` };
    return;
  }

  yield { type: 'status', message: `Will generate ${questionsToGenerate} new questions (have ${existingQuestions.length}, target ${targetCount})`, step: 1, totalSteps: 5 };

  // Fetch content
  yield { type: 'status', message: 'Fetching content from adapter...', step: 2, totalSteps: 5 };

  let content: ContentResult;
  try {
    const fetchOptions: any = { category, topic, subcategory };
    if (season && episode) {
      fetchOptions.season = season;
      fetchOptions.episode = episode;
      yield { type: 'info', message: `Loading S${season}E${episode} transcript...` };
    }
    content = await fetchContent(fetchOptions);
    yield { type: 'info', message: `Fetched: ${content.title} (${content.content.length} chars)` };
  } catch (error: any) {
    yield { type: 'error', message: `Failed to fetch content: ${error.message}` };
    return;
  }

  // Build prompt
  yield { type: 'status', message: 'Building prompt...', step: 3, totalSteps: 5 };
  const prompt = buildPrompt(content, category, questionsToGenerate, existingQuestions);

  // Generate questions
  yield { type: 'status', message: 'Generating questions with AI...', step: 4, totalSteps: 5 };

  let newQuestions: Question[];
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      yield { type: 'info', message: 'Using Claude API...' };
      newQuestions = await callClaudeAPI(prompt);
    } else if (process.env.GROQ_API_KEY) {
      yield { type: 'info', message: 'Using Groq API...' };
      newQuestions = await callGroqAPI(prompt);
    } else {
      yield { type: 'error', message: 'No API key set (ANTHROPIC_API_KEY or GROQ_API_KEY)' };
      return;
    }
    yield { type: 'info', message: `Generated ${newQuestions.length} new questions` };
  } catch (error: any) {
    yield { type: 'error', message: `AI generation failed: ${error.message}` };
    return;
  }

  // Save questions
  yield { type: 'status', message: 'Saving questions...', step: 5, totalSteps: 5 };

  const allQuestions = [...existingQuestions, ...newQuestions];
  const outputDir = join(DATA_PATH, category, topic);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const questionSet = {
    category,
    subcategory,
    topic,
    title: content.title,
    source: content.source,
    sourceUrl: content.sourceUrl,
    generatedAt: new Date().toISOString(),
    questionCount: allQuestions.length,
    questions: allQuestions,
    asOfDate: content.asOfDate,
    citations: content.citations,
  };

  writeFileSync(questionsPath, JSON.stringify(questionSet, null, 2));

  yield {
    type: 'complete',
    message: `Generated ${newQuestions.length} questions. Total: ${allQuestions.length}`,
    stats: {
      newQuestions: newQuestions.length,
      totalQuestions: allQuestions.length,
      target: targetCount,
    }
  };
}

// ============================================================================
// HTTP Server
// ============================================================================

const server = Bun.serve({
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
    if (path === '/api/stats') {
      return Response.json(getStats(), { headers: corsHeaders });
    }

    if (path === '/api/registry') {
      return Response.json(getRegistry(), { headers: corsHeaders });
    }

    if (path === '/api/topics') {
      return Response.json(getTopicsWithStatus(), { headers: corsHeaders });
    }

    if (path === '/api/recent') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      return Response.json(getRecentlyGenerated(limit), { headers: corsHeaders });
    }

    // Question Stats & Browser API
    if (path === '/api/question-stats') {
      return Response.json(scanAllQuestions(), { headers: corsHeaders });
    }

    if (path === '/api/questions-list') {
      const filters = {
        category: url.searchParams.get('category') || undefined,
        show: url.searchParams.get('show') || undefined,
        season: url.searchParams.get('season') ? parseInt(url.searchParams.get('season')!) : undefined,
        generator: url.searchParams.get('generator') || undefined,
        difficulty: url.searchParams.get('difficulty') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '50'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
      };
      return Response.json(getAllQuestions(filters), { headers: corsHeaders });
    }

    // TV Show API Routes
    if (path === '/api/tv-shows') {
      return Response.json(getTVShows(), { headers: corsHeaders });
    }

    if (path.match(/^\/api\/tv-shows\/([^/]+)\/seasons$/)) {
      const showSlug = path.split('/')[3];
      return Response.json(getTVShowSeasons(showSlug), { headers: corsHeaders });
    }

    if (path.match(/^\/api\/tv-shows\/([^/]+)\/seasons\/(\d+)\/episodes$/)) {
      const parts = path.split('/');
      const showSlug = parts[3];
      const season = parseInt(parts[5]);
      return Response.json(getTVShowEpisodes(showSlug, season), { headers: corsHeaders });
    }

    if (path === '/api/transcript-status') {
      const show = url.searchParams.get('show');
      const season = parseInt(url.searchParams.get('season') || '0');
      const episode = parseInt(url.searchParams.get('episode') || '0');

      if (!show || !season || !episode) {
        return Response.json({ error: 'Missing show, season, or episode' }, { status: 400, headers: corsHeaders });
      }

      return Response.json(getTranscriptStatus(show, season, episode), { headers: corsHeaders });
    }

    if (path === '/api/scrape-transcript' && req.method === 'POST') {
      const body = await req.json() as any;
      const { show, showName, season, episode } = body;

      if (!show || !showName || !season || !episode) {
        return Response.json({ error: 'Missing show, showName, season, or episode' }, { status: 400, headers: corsHeaders });
      }

      try {
        const result = await scrapeTranscript(show, showName, season, episode);
        return Response.json({ success: true, ...result }, { headers: corsHeaders });
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
      }
    }

    if (path === '/api/generate' && req.method === 'POST') {
      const body = await req.json() as any;
      const { category, subcategory, topic, season, episode } = body;

      if (!category || !subcategory || !topic) {
        return Response.json({ error: 'Missing category, subcategory, or topic' }, {
          status: 400,
          headers: corsHeaders
        });
      }

      // SSE Response
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          for await (const event of generateQuestionsSSE(category, subcategory, topic, season, episode)) {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Bulk Generate endpoint - fully server-side
    if (path === '/api/bulk-generate' && req.method === 'POST') {
      const body = await req.json() as any;
      const { category, depth, status, limit = 10 } = body;

      // Get topics based on filters
      const allTopics = getTopicsWithStatus();
      const depthOrder = ['immense', 'massive', 'large', 'medium', 'limited'];

      let topics = allTopics.filter((t: any) => {
        if (category && t.category !== category) return false;
        if (depth) {
          const depthIndex = depthOrder.indexOf(t.depth);
          const filterIndex = depthOrder.indexOf(depth);
          if (depthIndex > filterIndex) return false;
        }
        if (status === 'pending' && t.questionCount > 0) return false;
        if (status === 'incomplete' && t.questionCount >= t.targetCount) return false;
        return true;
      });

      // Sort by depth (immense first)
      topics.sort((a: any, b: any) => depthOrder.indexOf(a.depth) - depthOrder.indexOf(b.depth));
      topics = topics.slice(0, limit);

      if (topics.length === 0) {
        return Response.json({ error: 'No topics match the selected filters' }, {
          status: 400,
          headers: corsHeaders
        });
      }

      // SSE Response for bulk generation
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const send = (event: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          };

          // Send initial queue
          send({
            type: 'queue',
            topics: topics.map((t: any) => ({
              topic: t.topic,
              name: t.name,
              category: t.category,
              subcategory: t.subcategory,
              depth: t.depth,
            })),
            total: topics.length,
          });

          let completed = 0;
          let failed = 0;
          let totalNewQuestions = 0;

          for (let i = 0; i < topics.length; i++) {
            const t = topics[i] as any;

            send({
              type: 'topic-start',
              index: i,
              total: topics.length,
              topic: t.topic,
              name: t.name,
              category: t.category,
            });

            try {
              // Process each topic
              let lastEvent: any = null;
              for await (const event of generateQuestionsSSE(t.category, t.subcategory, t.topic)) {
                // Forward status updates with topic context
                send({
                  type: 'topic-progress',
                  index: i,
                  topic: t.topic,
                  name: t.name,
                  ...event,
                });
                lastEvent = event;
              }

              if (lastEvent?.type === 'complete') {
                completed++;
                totalNewQuestions += lastEvent.stats?.newQuestions || 0;
                send({
                  type: 'topic-complete',
                  index: i,
                  topic: t.topic,
                  name: t.name,
                  newQuestions: lastEvent.stats?.newQuestions || 0,
                  totalQuestions: lastEvent.stats?.totalQuestions || 0,
                });
              } else if (lastEvent?.type === 'error') {
                failed++;
                send({
                  type: 'topic-error',
                  index: i,
                  topic: t.topic,
                  name: t.name,
                  error: lastEvent.message,
                });
              }
            } catch (error: any) {
              failed++;
              send({
                type: 'topic-error',
                index: i,
                topic: t.topic,
                name: t.name,
                error: error.message,
              });
            }
          }

          // Final summary
          send({
            type: 'bulk-complete',
            total: topics.length,
            completed,
            failed,
            totalNewQuestions,
          });

          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Serve static files
    if (path === '/' || path === '/index.html') {
      const html = readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf8');
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (path === '/stats' || path === '/stats.html') {
      const html = readFileSync(join(process.cwd(), 'public', 'stats.html'), 'utf8');
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (path === '/questions' || path === '/questions.html') {
      const html = readFileSync(join(process.cwd(), 'public', 'questions.html'), 'utf8');
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
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
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎯 Question Generator Server                             ║
║                                                            ║
║   Running at: http://localhost:${PORT}                       ║
║                                                            ║
║   API Endpoints:                                           ║
║   • GET  /api/stats           - Dashboard statistics       ║
║   • GET  /api/registry        - Full topic registry        ║
║   • GET  /api/topics          - Topics with status         ║
║   • GET  /api/recent          - Recently generated         ║
║   • POST /api/generate        - Generate questions (SSE)   ║
║   • GET  /api/tv-shows        - List TV shows              ║
║   • GET  /api/transcript-status - Check transcript         ║
║   • POST /api/scrape-transcript - Scrape transcript        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
