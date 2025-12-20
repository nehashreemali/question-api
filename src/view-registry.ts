/**
 * View Registry - Shows all PLANNED content with actual question counts
 *
 * Reads the master registry (data-generation/registry.json) for what's planned,
 * then scans data/ folder to get actual question counts.
 *
 * Hierarchy: Category > Subcategory > Topic
 *
 * Run: bun src/view-registry.ts
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_PATH = join(process.cwd(), 'data');
const REGISTRY_PATH = join(process.cwd(), 'data-generation', 'registry.json');

// Master registry structure (from data-generation/registry.json)
interface MasterTopic {
  name: string;
  seasons?: number;
  episodes?: number;
}

interface MasterSubcategory {
  name: string;
  topics: Record<string, MasterTopic>;
}

interface MasterCategory {
  name: string;
  subcategories: Record<string, MasterSubcategory>;
}

interface MasterRegistry {
  description: string;
  categories: Record<string, MasterCategory>;
}

// Output structure
interface TopicStats {
  name: string;
  slug: string;
  questions: number;
  // For TV shows
  totalEpisodes?: number;
  completedEpisodes?: number;
}

interface SubcategoryStats {
  name: string;
  slug: string;
  questions: number;
  topics: TopicStats[];
  plannedTopics: number;
  completedTopics: number;
}

interface CategoryStats {
  name: string;
  slug: string;
  questions: number;
  subcategories: SubcategoryStats[];
  plannedTopics: number;
  completedTopics: number;
}

interface Registry {
  generatedAt: string;
  totalQuestions: number;
  totalPlanned: number;
  totalWithQuestions: number;
  categories: CategoryStats[];
}

function getQuestionCount(path: string): number {
  try {
    const questionsPath = join(path, 'questions.json');
    if (!existsSync(questionsPath)) return 0;
    const data = JSON.parse(readFileSync(questionsPath, 'utf8'));
    return data.questionCount || data.questions?.length || 0;
  } catch {
    return 0;
  }
}

function scanTvShow(showPath: string): { questions: number; episodes: number; completed: number } {
  let questions = 0;
  let episodes = 0;
  let completed = 0;

  if (!existsSync(showPath)) {
    return { questions: 0, episodes: 0, completed: 0 };
  }

  const seasons = readdirSync(showPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('season-'));

  for (const season of seasons) {
    const seasonPath = join(showPath, season.name);
    const eps = readdirSync(seasonPath, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name.startsWith('episode-'));

    for (const ep of eps) {
      episodes++;
      const count = getQuestionCount(join(seasonPath, ep.name));
      questions += count;
      if (count > 0) completed++;
    }
  }

  return { questions, episodes, completed };
}

function loadMasterRegistry(): MasterRegistry {
  if (!existsSync(REGISTRY_PATH)) {
    console.error(`Master registry not found at: ${REGISTRY_PATH}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
}

function buildRegistry(): Registry {
  const master = loadMasterRegistry();
  const categories: CategoryStats[] = [];
  let totalQuestions = 0;
  let totalPlanned = 0;
  let totalWithQuestions = 0;

  for (const [catSlug, catData] of Object.entries(master.categories)) {
    const subcategories: SubcategoryStats[] = [];
    let catQuestions = 0;
    let catPlannedTopics = 0;
    let catCompletedTopics = 0;

    for (const [subSlug, subData] of Object.entries(catData.subcategories)) {
      const topics: TopicStats[] = [];
      let subQuestions = 0;
      let subPlannedTopics = 0;
      let subCompletedTopics = 0;

      for (const [topicSlug, topicData] of Object.entries(subData.topics)) {
        subPlannedTopics++;
        totalPlanned++;

        // Path: data/{category}/{topic} (subcategory is organizational, not in path)
        const topicPath = join(DATA_PATH, catSlug, topicSlug);

        // Check if it's a TV show (has episodes in registry)
        if (topicData.episodes) {
          const stats = scanTvShow(topicPath);
          topics.push({
            name: topicData.name,
            slug: topicSlug,
            questions: stats.questions,
            totalEpisodes: topicData.episodes,
            completedEpisodes: stats.completed,
          });
          subQuestions += stats.questions;
          if (stats.questions > 0) {
            subCompletedTopics++;
            totalWithQuestions++;
          }
        } else {
          // Regular topic
          const questions = getQuestionCount(topicPath);
          topics.push({
            name: topicData.name,
            slug: topicSlug,
            questions,
          });
          subQuestions += questions;
          if (questions > 0) {
            subCompletedTopics++;
            totalWithQuestions++;
          }
        }
      }

      // Sort topics: with questions first, then alphabetically
      topics.sort((a, b) => {
        if (a.questions > 0 && b.questions === 0) return -1;
        if (a.questions === 0 && b.questions > 0) return 1;
        return a.name.localeCompare(b.name);
      });

      subcategories.push({
        name: subData.name,
        slug: subSlug,
        questions: subQuestions,
        topics,
        plannedTopics: subPlannedTopics,
        completedTopics: subCompletedTopics,
      });

      catQuestions += subQuestions;
      catPlannedTopics += subPlannedTopics;
      catCompletedTopics += subCompletedTopics;
    }

    // Sort subcategories: with questions first, then alphabetically
    subcategories.sort((a, b) => {
      if (a.questions > 0 && b.questions === 0) return -1;
      if (a.questions === 0 && b.questions > 0) return 1;
      return a.name.localeCompare(b.name);
    });

    categories.push({
      name: catData.name,
      slug: catSlug,
      questions: catQuestions,
      subcategories,
      plannedTopics: catPlannedTopics,
      completedTopics: catCompletedTopics,
    });

    totalQuestions += catQuestions;
  }

  return {
    generatedAt: new Date().toISOString(),
    totalQuestions,
    totalPlanned,
    totalWithQuestions,
    categories,
  };
}

function printRegistry(registry: Registry): void {
  console.log('\n' + '═'.repeat(80));
  console.log('  QUIZ QUESTION REGISTRY');
  console.log('═'.repeat(80));
  console.log(`  Generated: ${new Date(registry.generatedAt).toLocaleString()}`);
  console.log(`  Total Questions: ${registry.totalQuestions.toLocaleString()}`);
  console.log(`  Progress: ${registry.totalWithQuestions}/${registry.totalPlanned} topics have questions`);
  console.log('═'.repeat(80) + '\n');

  for (const cat of registry.categories) {
    const catProgress = `${cat.completedTopics}/${cat.plannedTopics}`;
    const catIcon = cat.completedTopics === cat.plannedTopics && cat.plannedTopics > 0 ? '✅' :
                    cat.completedTopics > 0 ? '🔶' : '⬜';

    console.log(`${catIcon} ${cat.name.toUpperCase()} [${catProgress} topics]`);
    console.log(`   ${cat.questions.toLocaleString()} questions`);
    console.log('─'.repeat(80));

    for (const sub of cat.subcategories) {
      const subProgress = `${sub.completedTopics}/${sub.plannedTopics}`;
      const subIcon = sub.completedTopics === sub.plannedTopics && sub.plannedTopics > 0 ? '●' :
                      sub.completedTopics > 0 ? '◐' : '○';

      console.log(`   ${subIcon} ${sub.name} [${subProgress}] - ${sub.questions.toLocaleString()} questions`);

      for (const topic of sub.topics) {
        const icon = topic.questions > 0 ? '✓' : '·';
        const name = topic.name.padEnd(35);
        const count = topic.questions.toLocaleString().padStart(6);

        if (topic.totalEpisodes) {
          const epProgress = `${topic.completedEpisodes}/${topic.totalEpisodes} eps`;
          console.log(`      ${icon} ${name} ${count} q  (${epProgress})`);
        } else {
          console.log(`      ${icon} ${name} ${count} q`);
        }
      }
    }
    console.log('');
  }

  // Summary table
  console.log('═'.repeat(80));
  console.log('  SUMMARY BY CATEGORY');
  console.log('─'.repeat(80));
  console.log('  Category'.padEnd(25) + 'Topics'.padStart(12) + 'Done'.padStart(8) + 'Questions'.padStart(12));
  console.log('─'.repeat(80));
  for (const cat of registry.categories) {
    const name = cat.name.padEnd(25);
    const planned = cat.plannedTopics.toString().padStart(12);
    const done = cat.completedTopics.toString().padStart(8);
    const questions = cat.questions.toLocaleString().padStart(12);
    console.log(`  ${name}${planned}${done}${questions}`);
  }
  console.log('─'.repeat(80));
  const totalName = 'TOTAL'.padEnd(25);
  const totalPlanned = registry.totalPlanned.toString().padStart(12);
  const totalDone = registry.totalWithQuestions.toString().padStart(8);
  const totalQ = registry.totalQuestions.toLocaleString().padStart(12);
  console.log(`  ${totalName}${totalPlanned}${totalDone}${totalQ}`);
  console.log('═'.repeat(80));
  console.log('  Legend: ✓/● = done, ·/○ = pending, ◐/🔶 = in progress');
  console.log('═'.repeat(80) + '\n');
}

// Main
const registry = buildRegistry();

// Save to file
const outputPath = join(DATA_PATH, 'registry.json');
writeFileSync(outputPath, JSON.stringify(registry, null, 2));
console.log(`Registry saved to: ${outputPath}`);

// Print summary
printRegistry(registry);
