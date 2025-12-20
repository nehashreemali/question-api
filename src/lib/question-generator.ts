/**
 * Question Generator - Functional implementation
 */

import axios from 'axios';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createLogger } from './logger.js';

const logger = createLogger('question-gen');

export interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
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
 * Check if questions already exist
 */
function questionsExist(show: string, season: number, episode: number): boolean {
  const showSlug = show.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const questionsPath = join(
    process.cwd(),
    'data',
    'tv-shows',
    showSlug,
    `season-${season}`,
    `episode-${episode}`,
    'questions.json'
  );

  return existsSync(questionsPath);
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

  if (!existsSync(episodeDir)) {
    mkdirSync(episodeDir, { recursive: true });
  }

  // Save full questions.json
  const questionsPath = join(episodeDir, 'questions.json');
  writeFileSync(questionsPath, JSON.stringify(questionSet, null, 2));
  logger.success(`Saved questions.json: ${questionsPath}`);

  // Save rawQuestions.json (just question text)
  const rawQuestions = questionSet.questions.map(q => q.question);
  const rawQuestionsPath = join(episodeDir, 'rawQuestions.json');
  writeFileSync(rawQuestionsPath, JSON.stringify(rawQuestions, null, 2));
  logger.success(`Saved rawQuestions.json: ${rawQuestionsPath}`);

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
    const questionsPath = join(
      process.cwd(),
      'data',
      'tv-shows',
      showSlug,
      `season-${season}`,
      `episode-${episode}`,
      'questions.json'
    );
    return JSON.parse(readFileSync(questionsPath, 'utf8'));
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
