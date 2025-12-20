# Generic Quiz Generator - Refactoring Plan

## Overview

Transform the TV-show-specific quiz generator into a **generic quiz question generator** that supports multiple content types with different hierarchies, sources, and prompt strategies.

---

## Current State

### What Exists
- TV show scraper (`src/lib/tv-scraper.ts`) - scrapes Friends & Subslikescript
- Question generator (`src/lib/question-generator.ts`) - TV-specific prompts
- 4-level manifest system (`src/lib/manifest.ts`) - series > season > episode
- Category taxonomy (`data/categories.ts`) - 54 categories, 540 subcategories

### What's Tightly Coupled to TV Shows
1. **Folder structure:** `data/tv-shows/{series}/{season}/{episode}/`
2. **Manifest types:** `EpisodeManifest`, `SeasonManifest`, `SeriesManifest`
3. **Question interfaces:** `QuestionSet` has `show`, `season`, `episode` fields
4. **Prompts:** Hard-coded for episode transcripts
5. **Scrapers:** Only TV transcript sources

---

## Target Architecture

### Three Content Categories

| Type | Description | Source | Hierarchy |
|------|-------------|--------|-----------|
| **Media** | Entertainment content | Transcripts/Scripts | Deep (series>season>episode) |
| **Knowledge** | Educational content | Wikipedia, OpenStax, Khan Academy | Shallow (category>topic) |
| **Sports** | Sports & competitions | Wikipedia + Stats APIs | sport>league/competition>topic |

**IMPORTANT:** All categories require source material. Content is grounded in verified sources to ensure accuracy and enable citations.

### Sports: A Unique Category

Sports requires special handling because:
1. **Data changes constantly** - new matches, new records, roster changes
2. **Stats are critical** - need accurate numbers from authoritative sources
3. **Temporal context** - questions need "as of" dates for stats that can change
4. **Multiple data types** - history, rules, statistics, current events

**Sports Sources:**

| Source | Data Type | Sports Covered |
|--------|-----------|----------------|
| **Wikipedia** | History, rules, bios | All |
| **ESPN API** | Stats, scores, standings | Most major sports |
| **ESPNcricinfo** | Cricket statistics | Cricket |
| **Pro-Football-Reference** | NFL statistics | American Football |
| **FBref** | Football (soccer) stats | Soccer |
| **Basketball-Reference** | NBA statistics | Basketball |
| **Cagematch/WWE API** | Wrestling stats | WWE, AEW |

**Question Freshness:**

All stats-based questions include temporal context:
```json
{
  "question": "As of December 2024, who holds the record for most Test centuries?",
  "correct_answer": "Sachin Tendulkar (51 centuries)",
  "citation": {
    "source": "ESPNcricinfo",
    "sourceUrl": "https://stats.espncricinfo.com/...",
    "retrievedAt": "2024-12-20"
  },
  "metadata": {
    "isTimeSensitive": true,
    "validAsOf": "2024-12-20",
    "mayChange": true
  }
}
```

**Historical questions don't need dates:**
```json
{
  "question": "Who won the 2011 Cricket World Cup?",
  "correct_answer": "India",
  "metadata": {
    "isTimeSensitive": false  // This fact will never change
  }
}
```

### Content Types

```
MEDIA CONTENT (requires source material):
├── tv-shows      → series > season > episode
├── movies        → franchise > movie (or standalone)
├── books         → series > book > chapter (or standalone)
├── podcasts      → show > episode
└── articles      → publication > article

KNOWLEDGE CONTENT (from educational sources):
├── science       → category > topic > source-article
├── history       → category > topic > source-article
├── geography     → category > topic > source-article
├── mathematics   → category > topic > source-article
└── ... (educational categories from categories.ts)

SPORTS CONTENT (from stats APIs + Wikipedia):
├── cricket       → format > topic (e.g., cricket/test/batting-records)
├── football      → league > topic (e.g., football/premier-league/all-time-scorers)
├── american-football → league > topic (e.g., american-football/nfl/super-bowl-winners)
├── basketball    → league > topic (e.g., basketball/nba/mvp-winners)
├── wwe           → division > topic (e.g., wwe/wwe-championship/title-history)
├── tennis        → tournament > topic (e.g., tennis/grand-slams/most-titles)
└── olympics      → sport > topic (e.g., olympics/athletics/100m-records)

Example paths:
  - physics/mechanics/newtons-laws-wikipedia
  - cricket/odi/highest-run-scorers
  - wwe/wrestlemania/main-event-history
```

### New Folder Structure

```
data/
├── manifest.json                    # Global manifest (all content types)
├── categories.ts                    # Category taxonomy (exists)
│
├── media/                           # Content with external sources
│   ├── manifest.json
│   ├── tv-shows/
│   │   ├── manifest.json
│   │   └── friends/
│   │       └── ... (existing structure)
│   ├── movies/
│   │   ├── manifest.json
│   │   └── marvel/
│   │       ├── manifest.json
│   │       └── iron-man/
│   │           ├── manifest.json
│   │           ├── transcript.json
│   │           └── questions.json
│   └── books/
│       └── ...
│
├── knowledge/                       # Educational content (from verified sources)
│   ├── manifest.json
│   ├── science/
│   │   ├── manifest.json
│   │   ├── physics/
│   │   │   ├── manifest.json
│   │   │   ├── mechanics/
│   │   │   │   ├── manifest.json
│   │   │   │   ├── source-wikipedia.json    # Cached source content
│   │   │   │   ├── source-openstax.json
│   │   │   │   └── questions.json
│   │   │   └── thermodynamics/
│   │   │       └── ...
│   │   └── chemistry/
│   │       └── ...
│   ├── history/
│   │   └── ...
│   └── geography/
│       └── ...
│
└── sports/                          # Sports content (from stats APIs)
    ├── manifest.json
    ├── cricket/
    │   ├── manifest.json
    │   ├── test/
    │   │   ├── manifest.json
    │   │   ├── batting-records/
    │   │   │   ├── manifest.json
    │   │   │   ├── source-wikipedia.json
    │   │   │   ├── source-cricinfo.json     # Stats API data
    │   │   │   └── questions.json
    │   │   └── bowling-records/
    │   │       └── ...
    │   ├── odi/
    │   │   └── ...
    │   └── t20/
    │       └── ...
    ├── football/
    │   ├── premier-league/
    │   │   └── ...
    │   └── world-cup/
    │       └── ...
    ├── wwe/
    │   ├── manifest.json
    │   ├── championships/
    │   │   ├── wwe-championship/
    │   │   │   ├── manifest.json
    │   │   │   ├── source-wikipedia.json
    │   │   │   ├── source-cagematch.json
    │   │   │   └── questions.json
    │   │   └── universal-championship/
    │   │       └── ...
    │   └── events/
    │       ├── wrestlemania/
    │       │   └── ...
    │       └── royal-rumble/
    │           └── ...
    └── basketball/
        └── nba/
            └── ...
```

---

## Implementation Phases

### Phase 1: Core Abstractions
**Goal:** Create the type system and interfaces that support multiple content types.

#### 1.1 Create Content Type Definitions
**File:** `src/types/content-types.ts`

```typescript
// Content type enum
export type ContentCategory = 'media' | 'knowledge';

// Base content type definition
export interface ContentTypeDefinition {
  id: string;                          // e.g., 'tv-shows', 'physics'
  name: string;                        // e.g., 'TV Shows', 'Physics'
  category: ContentCategory;
  hierarchy: HierarchyLevel[];         // Defines the depth structure
  promptTemplate: string;              // Key to prompt templates
  sourceAdapter?: string;              // For media types, which adapter to use
}

// Hierarchy level definition
export interface HierarchyLevel {
  id: string;                          // e.g., 'series', 'season', 'episode'
  name: string;                        // e.g., 'Series', 'Season', 'Episode'
  slug: string;                        // e.g., 'series', 'season-{n}', 'episode-{n}'
  isNumbered: boolean;                 // true for seasons/episodes, false for named items
  isLeaf: boolean;                     // true if this level contains questions
}

// Generic manifest that works for any level
export interface GenericManifest {
  type: string;                        // Content type ID
  level: string;                       // Hierarchy level ID
  path: string[];                      // Breadcrumb path
  info: Record<string, any>;           // Level-specific metadata
  progress: ProgressInfo;
  statistics: StatisticsInfo;
  children?: ChildInfo[];              // Non-leaf levels have children
  source?: SourceInfo;                 // Media types have source info
  questions?: QuestionsInfo;           // Leaf levels have questions
  metadata: MetadataInfo;
}
```

#### 1.2 Create Content Type Registry
**File:** `src/lib/content-registry.ts`

```typescript
// Registry of all content types
export const contentTypes: ContentTypeDefinition[] = [
  {
    id: 'tv-shows',
    name: 'TV Shows',
    category: 'media',
    hierarchy: [
      { id: 'series', name: 'Series', slug: '{slug}', isNumbered: false, isLeaf: false },
      { id: 'season', name: 'Season', slug: 'season-{n}', isNumbered: true, isLeaf: false },
      { id: 'episode', name: 'Episode', slug: 'episode-{n}', isNumbered: true, isLeaf: true },
    ],
    promptTemplate: 'tv-episode',
    sourceAdapter: 'tv-scraper',
  },
  {
    id: 'movies',
    name: 'Movies',
    category: 'media',
    hierarchy: [
      { id: 'franchise', name: 'Franchise', slug: '{slug}', isNumbered: false, isLeaf: false },
      { id: 'movie', name: 'Movie', slug: '{slug}', isNumbered: false, isLeaf: true },
    ],
    promptTemplate: 'movie',
    sourceAdapter: 'movie-scraper',
  },
  {
    id: 'physics',
    name: 'Physics',
    category: 'knowledge',
    hierarchy: [
      { id: 'topic', name: 'Topic', slug: '{slug}', isNumbered: false, isLeaf: true },
    ],
    promptTemplate: 'knowledge-topic',
  },
  // ... more content types from categories.ts
];

// Helper functions
export function getContentType(id: string): ContentTypeDefinition | undefined;
export function getContentTypesByCategory(category: ContentCategory): ContentTypeDefinition[];
export function buildPath(type: string, ...segments: string[]): string;
```

---

### Phase 2: Adapter Pattern for Sources
**Goal:** Abstract content fetching so different sources can be plugged in.

#### 2.1 Base Adapter Interface
**File:** `src/lib/adapters/base-adapter.ts`

```typescript
export interface SourceContent {
  title: string;
  content: string;                     // The actual text content
  wordCount: number;
  source: string;                      // Source name
  sourceUrl?: string;                  // Optional URL
  metadata?: Record<string, any>;      // Source-specific metadata
}

export interface ContentAdapter {
  id: string;
  name: string;

  // Check if this adapter can handle the request
  canHandle(contentType: string, path: string[]): boolean;

  // Fetch content for the given path
  fetch(contentType: string, path: string[]): Promise<SourceContent | null>;
}
```

#### 2.2 Refactor TV Scraper as Adapter
**File:** `src/lib/adapters/tv-scraper-adapter.ts`

```typescript
// Wrap existing tv-scraper.ts logic in adapter interface
export class TVScraperAdapter implements ContentAdapter {
  id = 'tv-scraper';
  name = 'TV Show Transcript Scraper';

  canHandle(contentType: string, path: string[]): boolean {
    return contentType === 'tv-shows' && path.length === 3;
  }

  async fetch(contentType: string, path: string[]): Promise<SourceContent | null> {
    const [series, season, episode] = path;
    // Use existing scrapeEpisode logic
  }
}
```

#### 2.3 Knowledge Source Adapters

**IMPORTANT DESIGN DECISION:** Knowledge content requires verified sources to ensure accuracy and enable citations. We use multiple free educational platforms.

##### Knowledge Sources

| Source | Content Type | License | Best For |
|--------|--------------|---------|----------|
| **Wikipedia** | Articles | CC BY-SA | General topics, breadth |
| **OpenStax** | Textbooks | CC BY | Structured learning, depth |
| **Khan Academy** | Video transcripts | Free | Explanations, examples |
| **CK-12** | Textbooks | CC BY-NC | K-12 content |

##### 2.3.1 Wikipedia Adapter
**File:** `src/lib/adapters/wikipedia-adapter.ts`

```typescript
export class WikipediaAdapter implements ContentAdapter {
  id = 'wikipedia';
  name = 'Wikipedia';

  async fetch(topic: string): Promise<SourceContent> {
    // Wikipedia REST API - free, no auth required
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;

    const response = await fetch(url);
    const article = await response.json();

    return {
      title: article.title,
      content: article.extract,
      wordCount: article.extract.split(/\s+/).length,
      source: 'Wikipedia',
      sourceUrl: article.content_urls.desktop.page,
      metadata: {
        license: 'CC BY-SA 3.0',
        lastModified: article.timestamp,
        description: article.description,
      }
    };
  }

  // For longer content, use the full article endpoint
  async fetchFull(topic: string): Promise<SourceContent> {
    const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(topic)}`;
    // Parse HTML, extract text content
  }
}
```

##### 2.3.2 OpenStax Adapter
**File:** `src/lib/adapters/openstax-adapter.ts`

```typescript
// OpenStax provides FREE, peer-reviewed college textbooks
// https://openstax.org/subjects
export class OpenStaxAdapter implements ContentAdapter {
  id = 'openstax';
  name = 'OpenStax Textbooks';

  // Maps our categories to OpenStax book slugs
  private bookMap: Record<string, string> = {
    'physics': 'college-physics-2e',
    'chemistry': 'chemistry-2e',
    'biology': 'biology-2e',
    'astronomy': 'astronomy-2e',
    'economics': 'principles-economics-3e',
    'psychology': 'psychology-2e',
    'sociology': 'introduction-sociology-3e',
    'statistics': 'introductory-statistics-2e',
    'anatomy': 'anatomy-and-physiology-2e',
    'microbiology': 'microbiology',
  };

  async fetch(category: string, chapterNum: number): Promise<SourceContent> {
    const bookSlug = this.bookMap[category];
    if (!bookSlug) throw new Error(`No OpenStax book for: ${category}`);

    // OpenStax API or web scraping
    // All content is CC BY 4.0 licensed
    return {
      title: `${category} - Chapter ${chapterNum}`,
      content: chapterContent,
      source: 'OpenStax',
      sourceUrl: `https://openstax.org/books/${bookSlug}/pages/${chapterNum}`,
      metadata: {
        license: 'CC BY 4.0',
        book: bookSlug,
        chapter: chapterNum,
      }
    };
  }
}
```

##### 2.3.3 Khan Academy Adapter
**File:** `src/lib/adapters/khan-adapter.ts`

```typescript
// Khan Academy - video transcripts for educational content
export class KhanAcademyAdapter implements ContentAdapter {
  id = 'khan-academy';
  name = 'Khan Academy';

  async fetch(subject: string, topic: string): Promise<SourceContent> {
    // Khan Academy has an API for content
    // Video transcripts are particularly good for explanatory content
    return {
      title: topic,
      content: transcript,
      source: 'Khan Academy',
      sourceUrl: `https://www.khanacademy.org/${subject}/${topic}`,
      metadata: {
        type: 'video-transcript',
        duration: videoDuration,
      }
    };
  }
}
```

##### 2.3.4 Source Aggregator
**File:** `src/lib/adapters/knowledge-aggregator.ts`

```typescript
// Combines multiple sources for comprehensive coverage
export class KnowledgeAggregator {
  private adapters = [
    new WikipediaAdapter(),
    new OpenStaxAdapter(),
    new KhanAcademyAdapter(),
  ];

  // Fetch from best available source based on topic
  async fetchBest(category: string, topic: string): Promise<SourceContent> {
    // Priority: OpenStax (if available) > Wikipedia > Khan Academy
    // Fallback chain if primary source fails
  }

  // Fetch from ALL sources for comprehensive questions
  async fetchAll(category: string, topic: string): Promise<SourceContent[]> {
    // Get content from all available sources
    // Each source generates different questions
    // Questions cite their specific source
  }
}
```

#### 2.4 Sports Adapters

Sports requires specialized adapters for statistics APIs.

##### 2.4.1 ESPN Adapter
**File:** `src/lib/adapters/espn-adapter.ts`

```typescript
// ESPN API - covers most major sports
export class ESPNAdapter implements ContentAdapter {
  id = 'espn';
  name = 'ESPN';

  private sportMap: Record<string, string> = {
    'american-football': 'football/nfl',
    'basketball': 'basketball/nba',
    'baseball': 'baseball/mlb',
    'hockey': 'hockey/nhl',
    'football': 'soccer',  // Soccer in US parlance
  };

  async fetch(sport: string, topic: string): Promise<SourceContent> {
    // ESPN has public endpoints for stats
    const espnSport = this.sportMap[sport];
    // Fetch standings, stats, records
    return {
      title: topic,
      content: statsData,
      source: 'ESPN',
      sourceUrl: `https://www.espn.com/${espnSport}/...`,
      metadata: {
        retrievedAt: new Date().toISOString(),
        isTimeSensitive: true,
      }
    };
  }
}
```

##### 2.4.2 Cricinfo Adapter
**File:** `src/lib/adapters/cricinfo-adapter.ts`

```typescript
// ESPNcricinfo - comprehensive cricket statistics
export class CricinfoAdapter implements ContentAdapter {
  id = 'cricinfo';
  name = 'ESPNcricinfo';

  async fetch(format: string, topic: string): Promise<SourceContent> {
    // format: 'test', 'odi', 't20'
    // topic: 'batting-records', 'bowling-records', 'team-records'

    // Cricinfo has detailed stats pages
    return {
      title: `${format.toUpperCase()} ${topic}`,
      content: cricketStats,
      source: 'ESPNcricinfo',
      sourceUrl: `https://stats.espncricinfo.com/...`,
      metadata: {
        format,
        retrievedAt: new Date().toISOString(),
        isTimeSensitive: true,
      }
    };
  }
}
```

##### 2.4.3 Wrestling Adapter (WWE/AEW)
**File:** `src/lib/adapters/wrestling-adapter.ts`

```typescript
// Cagematch.net or WWE.com for wrestling data
export class WrestlingAdapter implements ContentAdapter {
  id = 'wrestling';
  name = 'Wrestling Database';

  async fetch(promotion: string, topic: string): Promise<SourceContent> {
    // promotion: 'wwe', 'aew', 'njpw'
    // topic: 'wwe-championship', 'wrestlemania', 'royal-rumble'

    // Sources: Cagematch.net (comprehensive), WWE.com (official)
    return {
      title: `${promotion.toUpperCase()} - ${topic}`,
      content: wrestlingData,
      source: 'Cagematch',
      sourceUrl: `https://www.cagematch.net/...`,
      metadata: {
        promotion,
        retrievedAt: new Date().toISOString(),
        // Most title histories are stable, but current champions change
        isTimeSensitive: topic.includes('current'),
      }
    };
  }
}
```

##### 2.4.4 Sports Aggregator
**File:** `src/lib/adapters/sports-aggregator.ts`

```typescript
// Routes to correct sports adapter based on sport type
export class SportsAggregator {
  private adapters: Record<string, ContentAdapter> = {
    'cricket': new CricinfoAdapter(),
    'american-football': new ESPNAdapter(),
    'basketball': new ESPNAdapter(),
    'wwe': new WrestlingAdapter(),
    // Wikipedia as fallback for history/rules
    'default': new WikipediaAdapter(),
  };

  async fetch(sport: string, topic: string): Promise<SourceContent[]> {
    const sources: SourceContent[] = [];

    // Always get Wikipedia for context/history
    const wiki = await this.adapters['default'].fetch(`${sport} ${topic}`);
    sources.push(wiki);

    // Get stats from specialized adapter if available
    const specialized = this.adapters[sport];
    if (specialized) {
      const stats = await specialized.fetch(sport, topic);
      sources.push(stats);
    }

    return sources;
  }
}
```

#### 2.5 Adapter Registry
**File:** `src/lib/adapters/index.ts`

```typescript
const adapters: ContentAdapter[] = [
  // Media adapters
  new TVScraperAdapter(),
  // Future: MovieScraperAdapter, BookScraperAdapter, etc.

  // Knowledge adapters
  new WikipediaAdapter(),
  new OpenStaxAdapter(),
  new KhanAcademyAdapter(),

  // Sports adapters
  new ESPNAdapter(),
  new CricinfoAdapter(),
  new WrestlingAdapter(),
];

const knowledgeAggregator = new KnowledgeAggregator();
const sportsAggregator = new SportsAggregator();

export function getAdapter(contentType: string, path: string[]): ContentAdapter | undefined {
  return adapters.find(a => a.canHandle(contentType, path));
}

export async function fetchContent(contentType: string, path: string[]): Promise<SourceContent> {
  const adapter = getAdapter(contentType, path);
  if (!adapter) throw new Error(`No adapter for ${contentType}`);
  return adapter.fetch(contentType, path);
}
```

---

### Phase 3: Generalize Question Generator
**Goal:** Make question generation work with any content type using configurable prompts.

#### 3.1 Prompt Templates
**File:** `src/lib/prompts/index.ts`

```typescript
export interface PromptContext {
  contentType: string;
  path: string[];
  title: string;
  content: string;                     // Transcript, article text, or empty for knowledge
  questionsCount: number;
  difficulty?: 'mixed' | 'easy' | 'medium' | 'hard';
  metadata?: Record<string, any>;
}

export const promptTemplates: Record<string, (ctx: PromptContext) => string> = {
  'tv-episode': (ctx) => `
    You are an expert quiz question generator for TV shows...
    [existing prompt logic]
  `,

  'movie': (ctx) => `
    You are an expert quiz question generator for movies...
    Generate questions about plot, characters, dialogue, and scenes...
  `,

  'knowledge-topic': (ctx) => `
    You are an expert quiz question generator for educational content.

    Topic: ${ctx.path.join(' > ')}

    Generate ${ctx.questionsCount} high-quality multiple-choice questions about ${ctx.title}.

    Requirements:
    - Questions should test genuine understanding, not just memorization
    - Include a mix of conceptual, factual, and application-based questions
    - Difficulty distribution: 40% easy, 40% medium, 20% hard
    - Each question must have exactly 4 options
    - Include brief explanations for each answer

    [output format...]
  `,

  'book-chapter': (ctx) => `
    You are an expert quiz question generator for literature...
  `,
};

export function buildPrompt(templateId: string, context: PromptContext): string {
  const template = promptTemplates[templateId];
  if (!template) throw new Error(`Unknown prompt template: ${templateId}`);
  return template(context);
}
```

#### 3.2 Generalized Question Generator
**File:** `src/lib/question-generator.ts` (refactored)

```typescript
export interface GenerateOptions {
  contentType: string;                 // e.g., 'tv-shows', 'physics'
  path: string[];                      // e.g., ['friends', 'season-1', 'episode-1']
  groqApiKey: string;
  questionsCount?: number;
  model?: string;
  temperature?: number;
  skipIfExists?: boolean;
}

// Question with citation support
export interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;

  // Citation (required for knowledge content)
  citation?: {
    source: string;              // e.g., "Wikipedia", "OpenStax Physics"
    sourceUrl: string;           // Link to the source
    license?: string;            // e.g., "CC BY-SA 3.0"
    retrievedAt?: string;        // When the source was fetched
  };
}

export interface QuestionSet {
  contentType: string;
  path: string[];
  title: string;
  generatedAt: string;
  questionCount: number;
  questions: Question[];

  // Source information
  sources: Array<{
    name: string;                // e.g., "Wikipedia"
    url: string;
    license: string;
    questionsFromSource: number; // How many questions came from this source
  }>;
}

export async function generateQuestions(options: GenerateOptions): Promise<QuestionSet> {
  const { contentType, path } = options;

  // Get content type definition
  const typeDef = getContentType(contentType);
  if (!typeDef) throw new Error(`Unknown content type: ${contentType}`);

  // Fetch source content - BOTH media and knowledge need sources
  let sources: SourceContent[] = [];

  if (typeDef.category === 'media') {
    // Single source for media (transcript)
    const source = await fetchContent(contentType, path);
    sources = [source];
  } else {
    // Multiple sources for knowledge (Wikipedia, OpenStax, etc.)
    sources = await knowledgeAggregator.fetchAll(contentType, path);
  }

  // Generate questions from each source, with citations
  // Build prompt
  const prompt = buildPrompt(typeDef.promptTemplate, {
    contentType,
    path,
    title: sourceContent?.title || path.join(' > '),
    content: sourceContent?.content || '',
    questionsCount: options.questionsCount || 35,
  });

  // Call AI API
  const questions = await callGroqAPI(prompt, options);

  // Save and return
  return saveQuestions(contentType, path, questions);
}
```

---

### Phase 4: Generalize Manifest System
**Goal:** Make manifests work with any hierarchy depth.

#### 4.1 Generic Manifest Functions
**File:** `src/lib/manifest.ts` (refactored)

```typescript
// Path-based manifest operations (works for any hierarchy)
export function getManifest(contentType: string, path: string[]): GenericManifest | null;
export function saveManifest(contentType: string, path: string[], manifest: GenericManifest): void;
export function initManifest(contentType: string, path: string[], info: Record<string, any>): GenericManifest;

// Auto-aggregation (rolls up stats from children to parents)
export function updateFromChildren(contentType: string, path: string[]): void;

// Path utilities
export function getDataPath(contentType: string, path: string[]): string;
export function getManifestPath(contentType: string, path: string[]): string;
```

#### 4.2 Manifest Migration
- Keep backward compatibility with existing TV show data
- Add migration script to move `data/tv-shows/` to `data/media/tv-shows/`
- Update manifests to new generic format

---

### Phase 5: CLI Entry Points
**Goal:** Provide easy-to-use commands for different content types.

#### 5.1 Unified CLI
**File:** `src/cli.ts`

```typescript
// Usage examples:
// bun src/cli.ts tv-shows friends 1 1          # Generate for Friends S1E1
// bun src/cli.ts movies marvel iron-man        # Generate for Iron Man
// bun src/cli.ts physics mechanics             # Generate physics/mechanics questions
// bun src/cli.ts --list-types                  # List all content types
// bun src/cli.ts --init physics                # Initialize physics structure from categories.ts
```

#### 5.2 Knowledge Initializer
**File:** `src/init-knowledge.ts`

```typescript
// Reads categories.ts and creates folder structure + manifests
// for all knowledge categories
// Usage: bun src/init-knowledge.ts
```

#### 5.3 Batch Generator
**File:** `scripts/batch-generate.ts` (refactored)

```typescript
// Works with any content type
// Usage:
// bun scripts/batch-generate.ts tv-shows friends 1     # All of Friends S1
// bun scripts/batch-generate.ts physics                # All physics topics
```

---

### Phase 6: Data Migration
**Goal:** Move existing data to new structure without data loss.

#### 6.1 Migration Script
**File:** `scripts/migrate-to-generic.ts`

```typescript
// 1. Create new folder structure
// 2. Move data/tv-shows/ to data/media/tv-shows/
// 3. Update manifest formats to generic schema
// 4. Update global manifest
// 5. Verify integrity
```

#### 6.2 Backward Compatibility
- Keep old CLI commands working during transition
- Add deprecation warnings pointing to new commands

---

## File Changes Summary

### New Files
```
src/
├── types/
│   └── content-types.ts           # Content type definitions
├── lib/
│   ├── content-registry.ts        # Content type registry
│   ├── adapters/
│   │   ├── index.ts               # Adapter registry
│   │   ├── base-adapter.ts        # Adapter interface
│   │   │
│   │   │ # Media adapters
│   │   ├── tv-scraper-adapter.ts  # TV scraper (wraps existing)
│   │   │
│   │   │ # Knowledge adapters
│   │   ├── wikipedia-adapter.ts   # Wikipedia API adapter
│   │   ├── openstax-adapter.ts    # OpenStax textbook adapter
│   │   ├── khan-adapter.ts        # Khan Academy adapter
│   │   ├── knowledge-aggregator.ts # Combines knowledge sources
│   │   │
│   │   │ # Sports adapters
│   │   ├── espn-adapter.ts        # ESPN API for general sports
│   │   ├── cricinfo-adapter.ts    # ESPNcricinfo for cricket
│   │   ├── wrestling-adapter.ts   # Cagematch for WWE/AEW
│   │   └── sports-aggregator.ts   # Routes to correct sports adapter
│   │
│   ├── prompts/
│   │   ├── index.ts               # Prompt templates
│   │   └── quality-rules.ts       # Quality guidelines
│   ├── question-scorer.ts         # AI self-scoring
│   └── review-queue.ts            # Review queue management
├── cli.ts                         # Unified CLI
├── review-cli.ts                  # Human review interface
├── init-knowledge.ts              # Knowledge structure initializer
└── init-sports.ts                 # Sports structure initializer

scripts/
└── migrate-to-generic.ts          # Data migration
```

### Modified Files
```
src/lib/
├── question-generator.ts          # Generalize for any content type
├── manifest.ts                    # Generic manifest system
└── tv-scraper.ts                  # Minor refactor to work with adapter

index.ts                           # Update to use new system
```

### Data Structure Changes
```
data/
├── manifest.json                  # Updated: global across all types
├── categories.ts                  # Unchanged
├── media/                         # NEW: container for media content
│   └── tv-shows/                  # MOVED from data/tv-shows/
└── knowledge/                     # NEW: AI-generated content
```

---

## Implementation Order

### Step 1: Foundation (No Breaking Changes)
1. Create `src/types/content-types.ts`
2. Create `src/lib/content-registry.ts`
3. Create adapter interfaces and base classes
4. Add prompt templates system

### Step 2: Parallel Systems (Old + New)
5. Create `src/lib/adapters/tv-scraper-adapter.ts` (wraps existing)
6. Create `src/lib/adapters/knowledge-adapter.ts`
7. Create generic question generator (new function, keep old)
8. Create generic manifest functions (new functions, keep old)

### Step 3: Knowledge Content
9. Create `src/init-knowledge.ts`
10. Initialize knowledge structure from `categories.ts`
11. Test generating questions for knowledge topics

### Step 4: Unified CLI
12. Create `src/cli.ts` with support for all content types
13. Test with both TV shows and knowledge topics

### Step 5: Migration
14. Create migration script
15. Migrate existing TV show data
16. Update global manifest
17. Deprecate old entry points

### Step 6: Cleanup
18. Remove deprecated code
19. Update documentation
20. Final testing

### Step 7: Question Quality System
21. Create `src/lib/prompts/quality-rules.ts` with strict guidelines
22. Update generation prompts to include quality rules
23. Create `src/lib/question-scorer.ts` for AI self-scoring
24. Integrate scoring into question generation pipeline
25. Create `src/lib/review-queue.ts` for queue management
26. Create `src/review-cli.ts` for human review interface
27. Update manifests to track review statistics
28. Test end-to-end quality pipeline

---

## Testing Checklist

### Phase 1-2: Core System
- [ ] Content type registry returns correct types
- [ ] Adapters correctly identify what they can handle
- [ ] TV scraper adapter works with existing Friends data

### Phase 3: Question Generation
- [ ] Generate questions for existing TV episode (backward compat)
- [ ] Generate questions for knowledge topic (e.g., Physics > Mechanics)
- [ ] Prompt templates produce valid output

### Phase 4: Manifests
- [ ] Generic manifests save/load correctly
- [ ] Aggregation works across hierarchy levels
- [ ] Old manifest format still readable (migration)

### Phase 5: CLI
- [ ] `bun src/cli.ts tv-shows friends 1 1` works
- [ ] `bun src/cli.ts physics mechanics` works
- [ ] `bun src/cli.ts --list-types` shows all types

### Phase 6: Migration
- [ ] Existing data successfully migrated
- [ ] No data loss
- [ ] Old paths still work (backward compat)

### Phase 7: Question Quality
- [ ] Quality rules integrated into generation prompts
- [ ] AI scoring returns valid scores for all questions
- [ ] Auto-approve/reject thresholds work correctly
- [ ] Pending questions saved to questions-pending.json
- [ ] Review CLI displays questions correctly
- [ ] Approve/reject actions update files properly
- [ ] Manifest tracks review statistics

---

## Phase 7: Question Quality System

**Goal:** Ensure all questions are answerable, fun, and fair - not obscure trivia that frustrates players.

### The Problem

Bad questions that slip through:
- "What color was Chandler's shirt when playing poker?" (impossible to remember)
- "How many times did Ross say 'pivot'?" (exact counts)
- "What was on the coffee table in Monica's apartment?" (background detail)
- "What was the winning poker hand?" (trivial detail)

Good questions we want:
- "What word does Ross repeatedly yell while moving a couch?" → "Pivot!" (memorable)
- "Why does Chandler pretend to move to Yemen?" (plot point)
- "What is Joey's signature pickup line?" (iconic)

### Quality Dimensions

| Dimension | Score 1-5 | Description |
|-----------|-----------|-------------|
| **Answerability** | Could a fan answer without rewatching? | 1=impossible, 5=obvious |
| **Memorability** | Is this about a memorable moment? | 1=background noise, 5=iconic scene |
| **Fun Factor** | Would this be enjoyable to answer? | 1=frustrating, 5=satisfying |
| **Fairness** | Is the difficulty honest? | 1=trick question, 5=fair challenge |

**Minimum threshold:** Average score ≥ 3.0 to pass

### Three-Layer Quality System

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: PROMPT ENGINEERING (Prevention)                    │
│  Better instructions = fewer bad questions generated         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: AI SELF-SCORING (Auto-filter)                      │
│  Score each question, auto-reject score < 3.0                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: HUMAN REVIEW QUEUE (Final check)                   │
│  Review borderline questions, approve/reject/edit            │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1: Enhanced Prompt Engineering

**File:** `src/lib/prompts/quality-rules.ts`

```typescript
export const qualityRules = `
## QUESTION QUALITY RULES (CRITICAL)

### NEVER generate questions about:
- Colors of clothing, objects, or backgrounds
- Exact counts or numbers (how many times X happened)
- Minor background details (what was on a table, wall, etc.)
- Specific timestamps or durations
- One-off minor characters with no plot significance
- Random props or set decorations
- Anything requiring freeze-frame analysis

### ALWAYS generate questions about:
- Key plot developments and turning points
- Memorable quotes and catchphrases
- Character relationships and motivations
- Running jokes and recurring themes
- Iconic scenes that fans discuss
- Character traits and personality quirks
- Significant decisions and their consequences

### The "Dinner Party Test"
Before including a question, ask: "Would fans discussing this show at
a dinner party reasonably know this?" If no, don't include it.

### The "Rewatch Test"
Ask: "Would someone need to rewatch this specific episode to answer?"
If yes, the question is too obscure.

### Difficulty Guidelines
- EASY: Things mentioned multiple times or central to the plot
- MEDIUM: Specific but memorable moments, requires attention
- HARD: Subtle character moments, callbacks, or clever observations
         (NOT obscure trivia - hard should still be fair)
`;
```

### Layer 2: AI Self-Scoring

**File:** `src/lib/question-scorer.ts`

```typescript
export interface QuestionScore {
  answerability: number;      // 1-5
  memorability: number;       // 1-5
  funFactor: number;          // 1-5
  fairness: number;           // 1-5
  average: number;            // calculated
  flags: string[];            // e.g., ["too_obscure", "background_detail"]
  approved: boolean;          // average >= 3.0
}

export interface ScoredQuestion extends Question {
  score: QuestionScore;
}

// Two-pass generation:
// Pass 1: Generate questions
// Pass 2: Score each question (can be same API call with structured output)

export async function scoreQuestions(
  questions: Question[],
  context: { contentType: string; title: string }
): Promise<ScoredQuestion[]> {
  // Call AI to score each question
  const prompt = buildScoringPrompt(questions, context);
  const scores = await callGroqAPI(prompt);

  return questions.map((q, i) => ({
    ...q,
    score: scores[i],
  }));
}

export function filterByQuality(
  questions: ScoredQuestion[],
  minScore: number = 3.0
): { approved: ScoredQuestion[]; rejected: ScoredQuestion[] } {
  return {
    approved: questions.filter(q => q.score.average >= minScore),
    rejected: questions.filter(q => q.score.average < minScore),
  };
}
```

**Scoring Prompt:**
```typescript
const scoringPrompt = `
Score each question on these dimensions (1-5):

1. **Answerability**: Could someone who watched this content answer without rewatching?
   - 1: Impossible without freeze-framing
   - 3: Requires good attention during viewing
   - 5: Anyone who watched would know

2. **Memorability**: Is this about a memorable moment?
   - 1: Random background detail
   - 3: Notable scene, mentioned once
   - 5: Iconic moment fans discuss

3. **Fun Factor**: Would this be enjoyable to answer?
   - 1: Frustrating trick question
   - 3: Standard trivia
   - 5: "Oh I know this one!" moment

4. **Fairness**: Is the difficulty honest?
   - 1: Misleading or trick question
   - 3: Fair but tricky
   - 5: Clearly fair challenge

Flag any issues: "too_obscure", "background_detail", "exact_count",
"clothing_color", "minor_character", "trick_question"

Return JSON: { scores: [{ answerability, memorability, funFactor, fairness, flags }] }
`;
```

### Layer 3: Human Review Queue

**New files:**
- `src/lib/review-queue.ts` - Queue management
- `src/review-cli.ts` - CLI for reviewing questions

**Data structure:**
```
data/{content-type}/.../
├── questions.json           # Approved questions only
├── questions-pending.json   # Awaiting human review
├── questions-rejected.json  # Auto-rejected by AI scoring
└── manifest.json            # Includes review stats
```

**Review CLI:**
```bash
# See pending questions
bun src/review-cli.ts pending

# Review questions for specific content
bun src/review-cli.ts review tv-shows friends 1 1

# Bulk approve/reject
bun src/review-cli.ts approve-all --min-score 3.5
bun src/review-cli.ts reject-flagged --flag too_obscure
```

**Review Interface (CLI):**
```
┌─────────────────────────────────────────────────────────────┐
│ Question 1/15 - Friends S01E01                              │
├─────────────────────────────────────────────────────────────┤
│ Q: What does Monica say is "just some guy I work with"?     │
│                                                             │
│ A) Paul the wine guy  ← CORRECT                             │
│ B) Her new neighbor                                         │
│ C) Her dentist                                              │
│ D) Her gym trainer                                          │
│                                                             │
│ Difficulty: Medium                                          │
│ Scores: Answer=4 Memory=4 Fun=5 Fair=5 → AVG: 4.5 ✓         │
│ Flags: none                                                 │
├─────────────────────────────────────────────────────────────┤
│ [A]pprove  [R]eject  [E]dit  [S]kip  [Q]uit                │
└─────────────────────────────────────────────────────────────┘
```

### Manifest Updates

Add review tracking to manifests:

```typescript
interface QuestionsInfo {
  status: 'pending' | 'reviewed' | 'completed';
  generated: number;           // Total generated
  autoApproved: number;        // Score >= 3.5, auto-approved
  autoRejected: number;        // Score < 2.5, auto-rejected
  pendingReview: number;       // Score 2.5-3.5, needs human review
  humanApproved: number;       // Manually approved
  humanRejected: number;       // Manually rejected
  finalCount: number;          // In questions.json
  averageScore: number;        // Average quality score
  reviewedAt?: string;
  reviewedBy?: string;
}
```

### Implementation Files

```
src/
├── lib/
│   ├── prompts/
│   │   └── quality-rules.ts     # Quality guidelines for prompts
│   ├── question-scorer.ts       # AI scoring logic
│   └── review-queue.ts          # Queue management
└── review-cli.ts                # Human review interface
```

### Quality Thresholds

| Score Range | Action |
|-------------|--------|
| **4.0 - 5.0** | Auto-approve, add to questions.json |
| **3.0 - 3.9** | Add to pending queue for human review |
| **2.0 - 2.9** | Auto-reject with flags, log for analysis |
| **1.0 - 1.9** | Auto-reject, flag as serious quality issue |

### Metrics to Track

- **Generation quality:** % auto-approved vs rejected over time
- **Common flags:** Which quality issues appear most often
- **Prompt effectiveness:** Does improving prompts reduce rejections
- **Human override rate:** How often humans disagree with AI scores

---

## Process Flows

### Media Content Flow (TV Shows, Movies, Books)

```
┌─────────────────────────────────────────────────────────────────┐
│ USER: bun src/cli.ts tv-shows friends 1 1                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. IDENTIFY CONTENT TYPE                                         │
│    → tv-shows = media content                                    │
│    → Use TV Scraper Adapter                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FETCH SOURCE                                                  │
│    → Scrape transcript from fangj.github.io or Subslikescript   │
│    → Save to data/media/tv-shows/friends/season-1/episode-1/    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. GENERATE QUESTIONS                                            │
│    → Use tv-episode prompt template                              │
│    → Questions about THIS specific episode                       │
│    → No citation needed (questions are episode-specific)         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. QUALITY SCORING                                               │
│    → AI scores each question                                     │
│    → Auto-approve/reject based on thresholds                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. SAVE                                                          │
│    → questions.json (approved)                                   │
│    → questions-pending.json (needs review)                       │
│    → Update manifests                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Knowledge Content Flow (Physics, History, etc.)

```
┌─────────────────────────────────────────────────────────────────┐
│ USER: bun src/cli.ts physics mechanics                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. IDENTIFY CONTENT TYPE                                         │
│    → physics = knowledge content                                 │
│    → Use Knowledge Aggregator                                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FETCH SOURCES (Multiple)                                      │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ Wikipedia: "Classical Mechanics" article                 │ │
│    │ OpenStax: College Physics Chapter 4                      │ │
│    │ Khan Academy: "Introduction to Forces" transcript        │ │
│    └──────────────────────────────────────────────────────────┘ │
│    → Save source content with metadata                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. GENERATE QUESTIONS (Per Source)                               │
│    → Use knowledge-topic prompt template                         │
│    → Each question includes citation:                            │
│      {                                                           │
│        "question": "What is Newton's First Law?",                │
│        "citation": {                                             │
│          "source": "OpenStax College Physics",                   │
│          "sourceUrl": "https://openstax.org/...",                │
│          "license": "CC BY 4.0"                                  │
│        }                                                         │
│      }                                                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. QUALITY SCORING + DEDUPLICATION                               │
│    → Score each question                                         │
│    → Remove duplicate questions across sources                   │
│    → Auto-approve/reject                                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. SAVE                                                          │
│    → data/knowledge/physics/mechanics/                           │
│    → questions.json includes source breakdown:                   │
│      { sources: [                                                │
│          { name: "Wikipedia", questionsFromSource: 12 },         │
│          { name: "OpenStax", questionsFromSource: 18 },          │
│          { name: "Khan Academy", questionsFromSource: 10 }       │
│        ]                                                         │
│      }                                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Sports Content Flow (Cricket, Football, WWE, etc.)

```
┌─────────────────────────────────────────────────────────────────┐
│ USER: bun src/cli.ts cricket test batting-records              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. IDENTIFY CONTENT TYPE                                         │
│    → cricket = sports content                                    │
│    → Use Sports Aggregator → Cricinfo Adapter                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FETCH SOURCES (Wikipedia + Stats API)                        │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ Wikipedia: "Test cricket batting records" article        │ │
│    │ ESPNcricinfo: Current Test batting statistics            │ │
│    └──────────────────────────────────────────────────────────┘ │
│    → Each source timestamped with retrievedAt                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CLASSIFY QUESTION TYPES                                       │
│    → Historical: "Who scored the first Test century?" (static)   │
│    → Statistical: "Who has the most Test runs?" (time-sensitive) │
│    → Rules: "How many runs for a century?" (static)              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. GENERATE QUESTIONS WITH TEMPORAL CONTEXT                      │
│    → Time-sensitive questions get "As of {date}" prefix          │
│    → Historical questions have no date prefix                    │
│    → All questions get citations                                 │
│                                                                  │
│    Example output:                                               │
│    {                                                             │
│      "question": "As of December 2024, who holds the record     │
│                   for most runs in Test cricket?",               │
│      "correct_answer": "Sachin Tendulkar (15,921 runs)",         │
│      "metadata": {                                               │
│        "isTimeSensitive": true,                                  │
│        "validAsOf": "2024-12-20"                                 │
│      },                                                          │
│      "citation": {                                               │
│        "source": "ESPNcricinfo",                                 │
│        "retrievedAt": "2024-12-20"                               │
│      }                                                           │
│    }                                                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. QUALITY SCORING + SAVE                                        │
│    → data/sports/cricket/test/batting-records/                   │
│    → questions.json includes validity dates                      │
│    → Manifest tracks when data was last refreshed                │
└─────────────────────────────────────────────────────────────────┘
```

### Key Differences

| Aspect | Media Content | Knowledge Content | Sports Content |
|--------|--------------|-------------------|----------------|
| **Sources** | Single (transcript) | Multiple (Wiki, OpenStax) | Wiki + Stats APIs |
| **Citations** | Not needed | Required | Required + dated |
| **Temporal** | Static | Mostly static | Mixed (history vs current) |
| **Hierarchy** | Deep (series>season>ep) | Shallow (category>topic) | Medium (sport>format>topic) |
| **Updates** | Never | Rarely | Stats need periodic refresh |
| **Date prefix** | No | No | Yes (for current stats) |

---

## Open Questions

1. **Standalone vs Hierarchical Movies:** Should movies support both `movies/iron-man` (standalone) and `movies/marvel/iron-man` (franchise)?

2. **Knowledge Depth:** Should knowledge topics support deeper hierarchies? E.g., `physics/mechanics/newtons-laws/first-law`?

3. **Cross-referencing:** Should questions reference their source path? E.g., "From Physics > Mechanics"?

4. **Difficulty Presets:** Should knowledge topics have different default difficulty distributions than media content?

5. **Question Count:** Should different content types have different default question counts?

---

## Success Criteria

1. **Extensibility:** Adding a new content type requires only:
   - Adding entry to content registry
   - (Optional) Creating a new adapter if external source needed
   - (Optional) Creating a new prompt template

2. **Backward Compatibility:** Existing TV show generation still works

3. **Unified Interface:** Single CLI works for all content types

4. **Consistent Data:** All content types use the same manifest schema

5. **Knowledge Generation:** Can generate high-quality questions for any of the 54 categories without external sources
