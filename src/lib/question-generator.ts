/**
 * Question Generator - Functional implementation
 */

import axios from 'axios';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createLogger } from './logger.js';

const logger = createLogger('question-gen');

export interface QuestionTopic {
  type: string;
  show?: string;
  season?: number;
  episode?: number;
  title?: string;
  category?: string;
  subcategory?: string;
}

export interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  topic?: QuestionTopic;
  generatedBy?: string;
  generatedAt?: string;
}

export interface QuestionSet {
  show: string;
  season: number;
  episode: number;
  title: string;
  source: string;
  generatedAt: string;
  questionCount: number;
  questions: Question[];
}

export interface GenerateOptions {
  show: string;
  season: number;
  episode: number;
  groqApiKey: string;
  questionsCount?: number;
  model?: string;
  temperature?: number;
  skipIfExists?: boolean;
}

/**
 * Extract clean episode name from full title
 */
function extractEpisodeName(fullTitle: string): string {
  // e.g., "The Big Bang Theory (2007–…): Season 1, Episode 1  - Pilot - full transcript" -> "Pilot"
  const dashMatch = fullTitle.match(/\s+-\s+([^-]+)\s+-\s+/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }

  // For Friends format: "The One With..."
  if (fullTitle.startsWith('The One')) {
    return fullTitle;
  }

  return fullTitle;
}

/**
 * Load transcript from file system
 */
function loadTranscript(show: string, season: number, episode: number): any {
  const showSlug = show.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const transcriptPath = join(
    process.cwd(),
    'data',
    'tv-shows',
    showSlug,
    `season-${season}`,
    `episode-${episode}`,
    'transcript.json'
  );

  if (!existsSync(transcriptPath)) {
    throw new Error(`Transcript not found: ${transcriptPath}\nRun: bun src/scrape-tv.ts "${show}" ${season} ${episode}`);
  }

  return JSON.parse(readFileSync(transcriptPath, 'utf8'));
}

/**
 * Check if questions already exist (checks for any groq_questions_*.json files)
 */
function questionsExist(show: string, season: number, episode: number): boolean {
  const showSlug = show.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const questionsDir = join(
    process.cwd(),
    'data',
    'tv-shows',
    showSlug,
    `season-${season}`,
    `episode-${episode}`,
    'questions'
  );

  if (!existsSync(questionsDir)) {
    return false;
  }

  // Check if any groq_questions_*.json files exist
  const { readdirSync } = require('fs');
  const files = readdirSync(questionsDir);
  return files.some((f: string) => f.startsWith('groq_questions_') && f.endsWith('.json'));
}

/**
 * Build AI prompt for question generation
 */
function buildPrompt(transcript: any, episodeName: string, questionsCount: number): string {
  return `You are an expert quiz question generator for TV shows. Generate ${questionsCount} high-quality multiple-choice questions from this episode transcript.

**Show:** ${transcript.show}
**Episode:** ${episodeName}

**CRITICAL REQUIREMENTS:**

1. **Question Quality Standards:**
   - Questions must be SPECIFIC to this episode (not general show knowledge)
   - Reference exact dialogue, actions, or plot points from the transcript
   - Avoid vague or ambiguous questions
   - Each question should have ONE clearly correct answer
   - Wrong answers should be plausible but definitively incorrect
   - Write questions directly without episode name prefix (e.g., "What does Sheldon say..." not "In 'Pilot', what does Sheldon say...")

2. **Difficulty Distribution (${questionsCount} total):**
   - **Easy (40%):** Basic plot points, obvious character actions, main events
   - **Medium (40%):** Specific dialogue quotes, character motivations, scene details
   - **Hard (20%):** Subtle details, minor characters, background events, specific word choices

3. **Question Types to Include:**
   - Who said what? (quote specific dialogue)
   - What happened when? (sequence of events)
   - Why did character X do Y? (motivations)
   - What was character X's reaction to Y? (emotions/responses)
   - Where did scene X take place? (locations)
   - What object/item was mentioned? (specific props)

4. **Format Rules:**
   - Exactly 4 options per question
   - Options should be similar in length and structure
   - Avoid "All of the above" or "None of the above"
   - Correct answer must be verbatim one of the options
   - Include brief, factual explanations

**Example of GOOD question:**
{
  "question": "What does Monica say is 'just some guy I work with'?",
  "options": [
    "Paul the wine guy",
    "Her new neighbor",
    "Her dentist",
    "Her gym trainer"
  ],
  "correct_answer": "Paul the wine guy",
  "difficulty": "medium",
  "explanation": "Monica tells her friends 'There's nothing to tell! He's just some guy I work with!' when asked about Paul."
}

**Transcript:**
${transcript.transcript.substring(0, 20000)}

**Output Format (JSON only, no other text):**
{
  "questions": [
    {
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "correct_answer": "exact match to one option",
      "difficulty": "easy|medium|hard",
      "explanation": "brief factual explanation"
    }
  ]
}`;
}

/**
 * Call Groq API to generate questions
 */
async function callGroqAPI(
  prompt: string,
  apiKey: string,
  model: string,
  temperature: number
): Promise<Question[]> {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model,
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
      temperature,
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
 * Format timestamp for filename
 */
function formatTimestampForFilename(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}_${month}_${year}_${hours}${minutes}${seconds}`;
}

/**
 * Save questions to file system
 */
function saveQuestions(
  show: string,
  season: number,
  episode: number,
  questionSet: QuestionSet
): { questionsPath: string; rawQuestionsPath: string } {
  const showSlug = show.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const episodeDir = join(
    process.cwd(),
    'data',
    'tv-shows',
    showSlug,
    `season-${season}`,
    `episode-${episode}`
  );

  // Create questions subfolder
  const questionsDir = join(episodeDir, 'questions');
  if (!existsSync(questionsDir)) {
    mkdirSync(questionsDir, { recursive: true });
  }

  const generatedAt = new Date();
  const timestamp = formatTimestampForFilename(generatedAt);

  // Add topic info and metadata to each question
  const enhancedQuestions = questionSet.questions.map(q => ({
    ...q,
    topic: {
      type: 'tv-show',
      show: questionSet.show,
      season: questionSet.season,
      episode: questionSet.episode,
      title: questionSet.title,
    },
    generatedBy: 'groq',
    generatedAt: generatedAt.toISOString(),
  }));

  const enhancedQuestionSet = {
    ...questionSet,
    questions: enhancedQuestions,
  };

  // Save timestamped questions file
  const questionsFileName = `groq_questions_${timestamp}.json`;
  const questionsPath = join(questionsDir, questionsFileName);
  writeFileSync(questionsPath, JSON.stringify(enhancedQuestionSet, null, 2));
  logger.success(`Saved ${questionsFileName}`);

  // Load existing raw questions and append
  const rawQuestionsPath = join(questionsDir, 'groq_raw_questions.json');
  let existingRawQuestions: string[] = [];
  if (existsSync(rawQuestionsPath)) {
    try {
      existingRawQuestions = JSON.parse(readFileSync(rawQuestionsPath, 'utf8'));
    } catch {
      existingRawQuestions = [];
    }
  }

  // Append new questions (avoiding duplicates)
  const newRawQuestions = questionSet.questions.map(q => q.question);
  const allRawQuestions = [...new Set([...existingRawQuestions, ...newRawQuestions])];
  writeFileSync(rawQuestionsPath, JSON.stringify(allRawQuestions, null, 2));
  logger.success(`Updated groq_raw_questions.json (${allRawQuestions.length} total)`);

  return { questionsPath, rawQuestionsPath };
}

/**
 * Generate questions for a TV episode
 */
export async function generateQuestions(options: GenerateOptions): Promise<QuestionSet> {
  const {
    show,
    season,
    episode,
    groqApiKey,
    questionsCount = 35,
    model = 'llama-3.3-70b-versatile',
    temperature = 0.7,
    skipIfExists = true,
  } = options;

  logger.info(`Generating questions for ${show} S${season}E${episode}`);

  // Check if already exists
  if (skipIfExists && questionsExist(show, season, episode)) {
    logger.warn(`Questions already exist, skipping. Use skipIfExists=false to regenerate.`);
    const showSlug = show.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const questionsDir = join(
      process.cwd(),
      'data',
      'tv-shows',
      showSlug,
      `season-${season}`,
      `episode-${episode}`,
      'questions'
    );
    // Find the most recent groq_questions_*.json file
    const { readdirSync } = require('fs');
    const files = readdirSync(questionsDir)
      .filter((f: string) => f.startsWith('groq_questions_') && f.endsWith('.json'))
      .sort()
      .reverse();
    if (files.length > 0) {
      return JSON.parse(readFileSync(join(questionsDir, files[0]), 'utf8'));
    }
  }

  // Load transcript
  const transcript = loadTranscript(show, season, episode);
  logger.info(`Loaded transcript: ${transcript.title}`);
  logger.info(`Word count: ${transcript.wordCount.toLocaleString()} words`);

  // Extract episode name
  const episodeName = extractEpisodeName(transcript.title);
  logger.info(`Episode name: "${episodeName}"`);

  // Build prompt
  const prompt = buildPrompt(transcript, episodeName, questionsCount);

  // Call API
  logger.info(`Generating ${questionsCount} questions using Groq AI...`);
  const questions = await callGroqAPI(prompt, groqApiKey, model, temperature);
  logger.success(`Generated ${questions.length} questions!`);

  // Count by difficulty
  const difficultyCount = {
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
  };
  logger.info(`Breakdown: Easy ${difficultyCount.easy} | Medium ${difficultyCount.medium} | Hard ${difficultyCount.hard}`);

  // Prepare output
  const questionSet: QuestionSet = {
    show,
    season,
    episode,
    title: transcript.title,
    source: transcript.source,
    generatedAt: new Date().toISOString(),
    questionCount: questions.length,
    questions,
  };

  // Save to files
  saveQuestions(show, season, episode, questionSet);

  return questionSet;
}
