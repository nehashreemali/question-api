#!/usr/bin/env bun

/**
 * ❌ DEPRECATED – DO NOT USE
 *
 * This script is deprecated and will throw an error if executed.
 * All question generation must go through: scripts/generate-questions.ts
 * Requires arming phrase: POWER_UP generate_questions
 */
throw new Error('DEPRECATED: Use scripts/generate-questions.ts with POWER_UP arming phrase');

/**
 * Universal Question Generator
 *
 * Fetches content using adapters and generates questions using AI.
 * Supports Claude (Anthropic) and Groq APIs.
 * Works with all content types: TV shows, movies, science, sports, etc.
 *
 * Usage:
 *   bun src/generate.ts <category> <topic> [subcategory] [--count=N]
 *
 * Examples:
 *   bun src/generate.ts general-knowledge mahabharata indian-epics
 *   bun src/generate.ts sports cricket-world-cups cricket --count=20
 *   bun src/generate.ts science electricity ncert-class-10
 *   bun src/generate.ts movies marvel-mcu franchises
 *
 * Environment Variables:
 *   ANTHROPIC_API_KEY - Claude API key (preferred)
 *   GROQ_API_KEY - Groq API key (fallback)
 */

import axios from 'axios';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fetchContent } from './lib/adapters/index';
import type { ContentResult } from './lib/adapters/types';
import { createLogger } from './lib/logger';

const REGISTRY_PATH = join(process.cwd(), 'data-generation', 'registry.json');

const logger = createLogger('generate');

/**
 * Get adapter(s) for a category from registry
 * Returns an array of adapter names (supports both single string and array in registry)
 */
function getAdaptersForCategory(category: string): string[] {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  const categoryData = registry.categories[category];

  if (!categoryData) {
    throw new Error(`Category "${category}" not found in registry`);
  }

  // Support both "adapter" (string) and "adapters" (array)
  if (categoryData.adapters && Array.isArray(categoryData.adapters)) {
    return categoryData.adapters;
  }

  if (categoryData.adapter) {
    return [categoryData.adapter];
  }

  throw new Error(`No adapter defined for category "${category}" in registry`);
}

/**
 * Validate topic exists in registry
 */
function validateTopic(category: string, topic: string): { name: string; subcategory?: string } | null {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  const categoryData = registry.categories[category];

  if (!categoryData) return null;

  for (const [subKey, subData] of Object.entries(categoryData.subcategories || {})) {
    const sub = subData as any;
    if (sub.topics && sub.topics[topic]) {
      return { name: sub.topics[topic].name, subcategory: subKey };
    }
  }

  return null;
}

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

interface QuestionSet {
  category: string;
  subcategory?: string;
  topic: string;
  title: string;
  source: string;
  sourceUrl: string;
  generatedAt: string;
  questionCount: number;
  questions: Question[];
  // For sports - when stats were fetched
  asOfDate?: string;
  // Citations from source
  citations?: { text: string; source: string; url?: string }[];
}

/**
 * Build prompt for question generation based on content type
 */
function buildPrompt(content: ContentResult, category: string, questionsCount: number): string {
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

  return `You are an expert quiz question generator. Generate ${questionsCount} high-quality multiple-choice questions from the following content.

**Topic:** ${content.title}
**Category:** ${category}
**Source:** ${content.source}

${categorySpecificInstructions}

**CRITICAL REQUIREMENTS:**

1. **Question Quality Standards:**
   - Questions must be based ONLY on the provided content
   - Each question should have ONE clearly correct answer
   - Wrong answers should be plausible but definitively incorrect
   - Avoid vague or ambiguous questions

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

/**
 * Call Claude API (Anthropic) to generate questions
 */
async function callClaudeAPI(prompt: string): Promise<Question[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  logger.info('Calling Claude API...');

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: 'You are a professional quiz question generator. Generate high-quality, accurate questions. Return ONLY valid JSON with no additional text or markdown formatting.',
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    }
  );

  const content = response.data.content[0].text;
  // Parse JSON, handling possible markdown code blocks
  const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
  const aiResponse = JSON.parse(jsonStr);
  return aiResponse.questions;
}

/**
 * Call Groq API to generate questions
 */
async function callGroqAPI(prompt: string): Promise<Question[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable not set');
  }

  logger.info('Calling Groq API...');

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a professional quiz question generator. Generate high-quality, accurate questions. Return ONLY valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const aiResponse = JSON.parse(response.data.choices[0].message.content);
  return aiResponse.questions;
}

/**
 * Generate questions using available API (Claude preferred, Groq fallback)
 */
async function generateQuestions(prompt: string): Promise<Question[]> {
  // Prefer Claude if available
  if (process.env.ANTHROPIC_API_KEY) {
    return callClaudeAPI(prompt);
  }

  // Fall back to Groq
  if (process.env.GROQ_API_KEY) {
    return callGroqAPI(prompt);
  }

  throw new Error('No API key set. Please set ANTHROPIC_API_KEY or GROQ_API_KEY environment variable.');
}

/**
 * Save questions to file system
 */
function saveQuestions(
  category: string,
  topic: string,
  questionSet: QuestionSet
): string {
  const outputDir = join(process.cwd(), 'data', category, topic);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const questionsPath = join(outputDir, 'questions.json');
  writeFileSync(questionsPath, JSON.stringify(questionSet, null, 2));

  return questionsPath;
}

/**
 * Check if questions already exist
 */
function questionsExist(category: string, topic: string): boolean {
  const questionsPath = join(process.cwd(), 'data', category, topic, 'questions.json');
  return existsSync(questionsPath);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let category = '';
  let topic = '';
  let subcategory = '';
  let questionsCount = 25;
  let forceRegenerate = false;

  for (const arg of args) {
    if (arg.startsWith('--count=')) {
      questionsCount = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--force') {
      forceRegenerate = true;
    } else if (!category) {
      category = arg;
    } else if (!topic) {
      topic = arg;
    } else if (!subcategory) {
      subcategory = arg;
    }
  }

  if (!category || !topic) {
    console.log(`
Universal Question Generator

Usage:
  bun src/generate.ts <category> <topic> [subcategory] [--count=N] [--force]

Examples:
  bun src/generate.ts general-knowledge mahabharata indian-epics
  bun src/generate.ts sports cricket-world-cups cricket --count=20
  bun src/generate.ts science electricity ncert-class-10
  bun src/generate.ts movies marvel-mcu franchises --force

Options:
  --count=N   Number of questions to generate (default: 25)
  --force     Regenerate even if questions already exist

Environment Variables:
  ANTHROPIC_API_KEY   Claude API key (preferred)
  GROQ_API_KEY        Groq API key (fallback)
`);
    process.exit(1);
  }

  // Get adapters from registry
  let adapters: string[];
  try {
    adapters = getAdaptersForCategory(category);
  } catch (err: any) {
    logger.error(err.message);
    process.exit(1);
  }

  // Validate topic exists in registry
  const topicInfo = validateTopic(category, topic);
  if (!topicInfo) {
    logger.warn(`Topic "${topic}" not found in registry for category "${category}"`);
    logger.info('Proceeding anyway - topic may still work with adapter');
  } else if (!subcategory) {
    // Auto-fill subcategory from registry
    subcategory = topicInfo.subcategory || '';
  }

  // Check if already exists
  if (!forceRegenerate && questionsExist(category, topic)) {
    logger.warn(`Questions already exist for ${category}/${topic}`);
    logger.info('Use --force to regenerate');
    process.exit(0);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Generating ${questionsCount} questions for: ${category}/${topic}`);
  console.log(`Using adapters: ${adapters.join(' -> ')}`);
  console.log('='.repeat(60) + '\n');

  // Step 1: Fetch content using adapters (first available)
  logger.info(`Step 1: Fetching content using [${adapters.join(', ')}]...`);
  const content = await fetchContent({ category, topic, subcategory });
  logger.success(`Fetched: ${content.title} (${content.content.length} chars)`);

  // Step 2: Build prompt
  logger.info('Step 2: Building prompt...');
  const prompt = buildPrompt(content, category, questionsCount);

  // Step 3: Generate questions
  logger.info('Step 3: Generating questions with AI...');
  const questions = await generateQuestions(prompt);
  logger.success(`Generated ${questions.length} questions!`);

  // Count by difficulty
  const difficultyCount = {
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
  };
  logger.info(`Difficulty: Easy ${difficultyCount.easy} | Medium ${difficultyCount.medium} | Hard ${difficultyCount.hard}`);

  // Step 4: Save questions
  logger.info('Step 4: Saving questions...');
  const questionSet: QuestionSet = {
    category,
    subcategory,
    topic,
    title: content.title,
    source: content.source,
    sourceUrl: content.sourceUrl,
    generatedAt: new Date().toISOString(),
    questionCount: questions.length,
    questions,
    asOfDate: content.asOfDate,
    citations: content.citations,
  };

  const savedPath = saveQuestions(category, topic, questionSet);
  logger.success(`Saved to: ${savedPath}`);

  // Show sample questions
  console.log('\n' + '='.repeat(60));
  console.log('Sample Questions:');
  console.log('='.repeat(60));

  questions.slice(0, 3).forEach((q, i) => {
    console.log(`\n${i + 1}. [${q.difficulty.toUpperCase()}] ${q.question}`);
    q.options.forEach((opt, j) => {
      const marker = opt === q.correct_answer ? '✓' : ' ';
      console.log(`   ${marker} ${String.fromCharCode(65 + j)}. ${opt}`);
    });
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Done! Generated ${questions.length} questions.`);
  console.log('='.repeat(60) + '\n');
}

main().catch(err => {
  logger.error(err.message);
  process.exit(1);
});
