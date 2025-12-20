import axios from 'axios';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const dataDir = join(import.meta.dir, 'data');
const questionsDir = join(import.meta.dir, 'questions');
if (!existsSync(questionsDir)) mkdirSync(questionsDir);

async function generateQuestions(fileName: string, count = 5) {
  const data = JSON.parse(readFileSync(join(dataDir, fileName), 'utf8'));
  console.log(`🤖 Generating ${count} questions for: ${data.title}`);

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Generate quiz questions. Return only valid JSON.' },
        {
          role: 'user',
          content: `Generate ${count} quiz questions from this content:\n\n${data.content.substring(0, 10000)}\n\nFormat:\n{"questions":[{"question":"?","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const parsed = JSON.parse(response.data.choices[0].message.content);
  const output = {
    source: data.title,
    sourceUrl: data.url,
    generatedAt: new Date().toISOString(),
    questions: parsed.questions,
  };

  const outFile = fileName.replace('.json', '_questions.json');
  writeFileSync(join(questionsDir, outFile), JSON.stringify(output, null, 2));

  console.log(`✅ Generated ${parsed.questions.length} questions → ${outFile}`);
  parsed.questions.forEach((q: any, i: number) => {
    console.log(`\nQ${i + 1}: ${q.question}`);
    q.options.forEach((opt: string, j: number) => console.log(`  ${j}. ${opt}`));
    console.log(`  ✓ ${q.options[q.correctIndex]}`);
  });
}

const fileName = process.argv[2];
const count = parseInt(process.argv[3]) || 5;

if (!fileName) {
  console.log('Usage: bun generate.ts <file.json> [count]');
  process.exit(1);
}

generateQuestions(fileName, count);
