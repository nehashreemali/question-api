/**
 * Classic books downloader - Project Gutenberg
 * Usage: bun src/download-books.ts [category]
 * Categories: shakespeare, holmes, austen, dickens, gothic, adventure, american, greek, all
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('books');
const rateLimiter = createRateLimiter(1); // 1 request per second

const BOOKS_DIR = join(process.cwd(), 'generation', 'books');

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  subcategory?: string;
  year?: number;
}

// ============================================
// BOOK CATALOG
// ============================================

const BOOKS: Book[] = [
  // ==========================================
  // SHERLOCK HOLMES - Arthur Conan Doyle
  // ==========================================
  { id: 1661, title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'mystery', subcategory: 'sherlock-holmes' },
  { id: 834, title: 'The Memoirs of Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'mystery', subcategory: 'sherlock-holmes' },
  { id: 108, title: 'The Return of Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'mystery', subcategory: 'sherlock-holmes' },
  { id: 2852, title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', category: 'mystery', subcategory: 'sherlock-holmes' },
  { id: 244, title: 'A Study in Scarlet', author: 'Arthur Conan Doyle', category: 'mystery', subcategory: 'sherlock-holmes' },
  { id: 2097, title: 'The Sign of the Four', author: 'Arthur Conan Doyle', category: 'mystery', subcategory: 'sherlock-holmes' },
  { id: 3289, title: 'The Valley of Fear', author: 'Arthur Conan Doyle', category: 'mystery', subcategory: 'sherlock-holmes' },
  { id: 2350, title: 'His Last Bow', author: 'Arthur Conan Doyle', category: 'mystery', subcategory: 'sherlock-holmes' },
  { id: 69700, title: 'The Case-Book of Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'mystery', subcategory: 'sherlock-holmes' },

  // ==========================================
  // SHAKESPEARE
  // ==========================================
  { id: 100, title: 'The Complete Works of Shakespeare', author: 'William Shakespeare', category: 'classics', subcategory: 'shakespeare' },
  { id: 1041, title: 'Shakespeares Sonnets', author: 'William Shakespeare', category: 'poetry', subcategory: 'shakespeare' },
  { id: 1524, title: 'Hamlet', author: 'William Shakespeare', category: 'classics', subcategory: 'shakespeare' },
  { id: 1533, title: 'Macbeth', author: 'William Shakespeare', category: 'classics', subcategory: 'shakespeare' },
  { id: 1531, title: 'Othello', author: 'William Shakespeare', category: 'classics', subcategory: 'shakespeare' },
  { id: 1532, title: 'King Lear', author: 'William Shakespeare', category: 'classics', subcategory: 'shakespeare' },
  { id: 1513, title: 'Romeo and Juliet', author: 'William Shakespeare', category: 'classics', subcategory: 'shakespeare' },
  { id: 1522, title: 'Julius Caesar', author: 'William Shakespeare', category: 'classics', subcategory: 'shakespeare' },
  { id: 1514, title: 'A Midsummer Nights Dream', author: 'William Shakespeare', category: 'classics', subcategory: 'shakespeare' },
  { id: 1515, title: 'The Merchant of Venice', author: 'William Shakespeare', category: 'classics', subcategory: 'shakespeare' },
  { id: 1526, title: 'Twelfth Night', author: 'William Shakespeare', category: 'classics', subcategory: 'shakespeare' },
  { id: 1540, title: 'The Tempest', author: 'William Shakespeare', category: 'classics', subcategory: 'shakespeare' },

  // ==========================================
  // JANE AUSTEN
  // ==========================================
  { id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen', category: 'classics', subcategory: 'austen', year: 1813 },
  { id: 161, title: 'Sense and Sensibility', author: 'Jane Austen', category: 'classics', subcategory: 'austen', year: 1811 },
  { id: 158, title: 'Emma', author: 'Jane Austen', category: 'classics', subcategory: 'austen', year: 1816 },
  { id: 141, title: 'Mansfield Park', author: 'Jane Austen', category: 'classics', subcategory: 'austen', year: 1814 },
  { id: 105, title: 'Persuasion', author: 'Jane Austen', category: 'classics', subcategory: 'austen', year: 1817 },
  { id: 121, title: 'Northanger Abbey', author: 'Jane Austen', category: 'classics', subcategory: 'austen', year: 1817 },

  // ==========================================
  // CHARLES DICKENS
  // ==========================================
  { id: 1400, title: 'Great Expectations', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 730, title: 'Oliver Twist', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 46, title: 'A Christmas Carol', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 766, title: 'David Copperfield', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 98, title: 'A Tale of Two Cities', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 1023, title: 'Bleak House', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 580, title: 'The Pickwick Papers', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 967, title: 'Nicholas Nickleby', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 883, title: 'The Mystery of Edwin Drood', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 821, title: 'Our Mutual Friend', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 963, title: 'Little Dorrit', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 821, title: 'Dombey and Son', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 786, title: 'Hard Times', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 700, title: 'The Old Curiosity Shop', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },
  { id: 564, title: 'The Cricket on the Hearth', author: 'Charles Dickens', category: 'classics', subcategory: 'dickens' },

  // ==========================================
  // RUDYARD KIPLING
  // ==========================================
  { id: 236, title: 'The Jungle Book', author: 'Rudyard Kipling', category: 'classics', subcategory: 'kipling' },
  { id: 1937, title: 'The Second Jungle Book', author: 'Rudyard Kipling', category: 'classics', subcategory: 'kipling' },
  { id: 2226, title: 'Kim', author: 'Rudyard Kipling', category: 'classics', subcategory: 'kipling' },
  { id: 2781, title: 'Just So Stories', author: 'Rudyard Kipling', category: 'classics', subcategory: 'kipling' },
  { id: 3420, title: 'Captains Courageous', author: 'Rudyard Kipling', category: 'classics', subcategory: 'kipling' },
  { id: 1640, title: 'Plain Tales from the Hills', author: 'Rudyard Kipling', category: 'classics', subcategory: 'kipling' },
  { id: 2138, title: 'The Man Who Would Be King', author: 'Rudyard Kipling', category: 'classics', subcategory: 'kipling' },
  { id: 557, title: 'Puck of Pooks Hill', author: 'Rudyard Kipling', category: 'classics', subcategory: 'kipling' },
  { id: 6982, title: 'Rewards and Fairies', author: 'Rudyard Kipling', category: 'classics', subcategory: 'kipling' },
  { id: 3006, title: 'Stalky and Co', author: 'Rudyard Kipling', category: 'classics', subcategory: 'kipling' },

  // ==========================================
  // GOTHIC HORROR
  // ==========================================
  { id: 84, title: 'Frankenstein', author: 'Mary Shelley', category: 'gothic', year: 1818 },
  { id: 345, title: 'Dracula', author: 'Bram Stoker', category: 'gothic', year: 1897 },
  { id: 43, title: 'The Strange Case of Dr Jekyll and Mr Hyde', author: 'Robert Louis Stevenson', category: 'gothic' },
  { id: 174, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', category: 'gothic' },
  { id: 209, title: 'The Turn of the Screw', author: 'Henry James', category: 'gothic' },
  { id: 10007, title: 'Carmilla', author: 'Sheridan Le Fanu', category: 'gothic' },
  { id: 175, title: 'The Phantom of the Opera', author: 'Gaston Leroux', category: 'gothic' },
  { id: 696, title: 'The Castle of Otranto', author: 'Horace Walpole', category: 'gothic' },

  // ==========================================
  // ADVENTURE
  // ==========================================
  { id: 1184, title: 'The Count of Monte Cristo', author: 'Alexandre Dumas', category: 'adventure' },
  { id: 1257, title: 'The Three Musketeers', author: 'Alexandre Dumas', category: 'adventure' },
  { id: 2488, title: 'Twenty Thousand Leagues Under the Sea', author: 'Jules Verne', category: 'adventure' },
  { id: 103, title: 'Around the World in Eighty Days', author: 'Jules Verne', category: 'adventure' },
  { id: 18857, title: 'Journey to the Center of the Earth', author: 'Jules Verne', category: 'adventure' },
  { id: 120, title: 'Treasure Island', author: 'Robert Louis Stevenson', category: 'adventure' },
  { id: 521, title: 'Robinson Crusoe', author: 'Daniel Defoe', category: 'adventure' },
    { id: 2166, title: 'King Solomons Mines', author: 'H. Rider Haggard', category: 'adventure' },

  // ==========================================
  // AMERICAN CLASSICS
  // ==========================================
  { id: 76, title: 'Adventures of Huckleberry Finn', author: 'Mark Twain', category: 'american' },
  { id: 74, title: 'The Adventures of Tom Sawyer', author: 'Mark Twain', category: 'american' },
  { id: 2701, title: 'Moby Dick', author: 'Herman Melville', category: 'american' },
  { id: 64317, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'american', year: 1925 },
  { id: 25344, title: 'The Scarlet Letter', author: 'Nathaniel Hawthorne', category: 'american' },
  { id: 514, title: 'Little Women', author: 'Louisa May Alcott', category: 'american' },
  { id: 215, title: 'The Call of the Wild', author: 'Jack London', category: 'american' },
  { id: 910, title: 'White Fang', author: 'Jack London', category: 'american' },
  { id: 205, title: 'Walden', author: 'Henry David Thoreau', category: 'american' },

  // ==========================================
  // GREEK CLASSICS
  // ==========================================
  { id: 6130, title: 'The Iliad', author: 'Homer', category: 'greek' },
  { id: 1727, title: 'The Odyssey', author: 'Homer', category: 'greek' },
  { id: 11339, title: 'Aesops Fables', author: 'Aesop', category: 'greek' },
  { id: 1497, title: 'The Republic', author: 'Plato', category: 'greek' },
  { id: 2680, title: 'Meditations', author: 'Marcus Aurelius', category: 'greek' },

  // ==========================================
  // RUSSIAN LITERATURE
  // ==========================================
  { id: 2554, title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', category: 'russian' },
  { id: 28054, title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', category: 'russian' },
  { id: 2600, title: 'War and Peace', author: 'Leo Tolstoy', category: 'russian' },
  { id: 1399, title: 'Anna Karenina', author: 'Leo Tolstoy', category: 'russian' },

  // ==========================================
  // BRONTE SISTERS
  // ==========================================
  { id: 1260, title: 'Jane Eyre', author: 'Charlotte Bronte', category: 'classics', subcategory: 'bronte' },
  { id: 768, title: 'Wuthering Heights', author: 'Emily Bronte', category: 'classics', subcategory: 'bronte' },

  // ==========================================
  // FRENCH LITERATURE
  // ==========================================
  { id: 135, title: 'Les Miserables', author: 'Victor Hugo', category: 'french' },
  { id: 2610, title: 'The Hunchback of Notre-Dame', author: 'Victor Hugo', category: 'french' },
  { id: 19942, title: 'Candide', author: 'Voltaire', category: 'french' },

  // ==========================================
  // POETRY
  // ==========================================
  { id: 10031, title: 'Complete Poetical Works of Edgar Allan Poe', author: 'Edgar Allan Poe', category: 'poetry' },
  { id: 1322, title: 'Leaves of Grass', author: 'Walt Whitman', category: 'poetry' },
  { id: 26, title: 'Paradise Lost', author: 'John Milton', category: 'poetry' },
  { id: 8800, title: 'The Divine Comedy', author: 'Dante Alighieri', category: 'poetry' },

  // ==========================================
  // CHILDREN'S CLASSICS
  // ==========================================
  { id: 11, title: 'Alices Adventures in Wonderland', author: 'Lewis Carroll', category: 'children' },
  { id: 12, title: 'Through the Looking-Glass', author: 'Lewis Carroll', category: 'children' },
  { id: 16, title: 'Peter Pan', author: 'J.M. Barrie', category: 'children' },
  { id: 55, title: 'The Wonderful Wizard of Oz', author: 'L. Frank Baum', category: 'children' },
  { id: 289, title: 'The Wind in the Willows', author: 'Kenneth Grahame', category: 'children' },
  { id: 113, title: 'The Secret Garden', author: 'Frances Hodgson Burnett', category: 'children' },
  { id: 45, title: 'Anne of Green Gables', author: 'L.M. Montgomery', category: 'children' },
];

// ============================================
// DOWNLOAD FUNCTIONS
// ============================================

async function downloadBook(book: Book): Promise<boolean> {
  const categoryDir = join(BOOKS_DIR, book.category);
  if (!existsSync(categoryDir)) mkdirSync(categoryDir, { recursive: true });

  const slug = book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const filepath = join(categoryDir, `${slug}.json`);

  if (existsSync(filepath)) {
    logger.info(`  ${book.title} - already exists, skipping`);
    return false;
  }

  await rateLimiter();

  // Try multiple URL formats
  const urls = [
    `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`,
    `https://www.gutenberg.org/files/${book.id}/${book.id}-0.txt`,
    `https://www.gutenberg.org/files/${book.id}/${book.id}.txt`,
  ];

  let content: string | null = null;

  for (const url of urls) {
    try {
      content = await fetchWithRetry(url, 2);
      if (content && content.length > 1000) break;
    } catch (e) {
      // Try next URL
    }
    await sleep(500);
  }

  if (!content || content.length < 1000) {
    logger.error(`  ${book.title} - failed to download`);
    return false;
  }

  // Clean up Gutenberg header/footer
  const startMarkers = ['*** START OF THIS PROJECT GUTENBERG', '*** START OF THE PROJECT GUTENBERG', '*END*THE SMALL PRINT'];
  const endMarkers = ['*** END OF THIS PROJECT GUTENBERG', '*** END OF THE PROJECT GUTENBERG', 'End of Project Gutenberg', 'End of the Project Gutenberg'];

  let cleanContent = content;

  for (const marker of startMarkers) {
    const idx = cleanContent.indexOf(marker);
    if (idx !== -1) {
      const nextNewline = cleanContent.indexOf('\n', idx);
      if (nextNewline !== -1) {
        cleanContent = cleanContent.substring(nextNewline + 1);
        break;
      }
    }
  }

  for (const marker of endMarkers) {
    const idx = cleanContent.indexOf(marker);
    if (idx !== -1) {
      cleanContent = cleanContent.substring(0, idx);
      break;
    }
  }

  cleanContent = cleanContent.trim();

  // Save the book
  writeFileSync(filepath, JSON.stringify({
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category,
    subcategory: book.subcategory,
    year: book.year,
    content: cleanContent,
    wordCount: cleanContent.split(/\s+/).length,
    source: 'gutenberg.org',
    sourceUrl: `https://www.gutenberg.org/ebooks/${book.id}`,
    downloadedAt: new Date().toISOString(),
  }, null, 2));

  logger.success(`  ${book.title} - ${cleanContent.split(/\s+/).length.toLocaleString()} words`);
  return true;
}

async function downloadCategory(category: string) {
  const books = BOOKS.filter(b =>
    b.category === category ||
    b.subcategory === category ||
    (category === 'holmes' && b.subcategory === 'sherlock-holmes')
  );

  if (books.length === 0) {
    logger.error(`No books found for category: ${category}`);
    return;
  }

  logger.info(`\n=== Downloading ${category.toUpperCase()} (${books.length} books) ===\n`);

  let downloaded = 0;
  let skipped = 0;

  for (const book of books) {
    const result = await downloadBook(book);
    if (result) downloaded++;
    else skipped++;
    await sleep(1000); // Be nice to Gutenberg
  }

  logger.info(`\n${category}: Downloaded ${downloaded}, Skipped ${skipped}\n`);
}

async function downloadAll() {
  const categories = [...new Set(BOOKS.map(b => b.category))];

  for (const category of categories) {
    await downloadCategory(category);
  }
}

// ============================================
// MAIN
// ============================================
async function main() {
  const category = process.argv[2];

  if (!existsSync(BOOKS_DIR)) {
    mkdirSync(BOOKS_DIR, { recursive: true });
  }

  logger.info('=== Project Gutenberg Book Downloader ===');
  logger.info(`Total books in catalog: ${BOOKS.length}\n`);

  if (!category || category === 'all') {
    await downloadAll();
  } else if (category === 'list') {
    // List available categories
    const categories = [...new Set(BOOKS.map(b => b.category))];
    logger.info('Available categories:');
    for (const cat of categories) {
      const count = BOOKS.filter(b => b.category === cat).length;
      logger.info(`  ${cat}: ${count} books`);
    }
  } else {
    await downloadCategory(category);
  }

  logger.info('\n=== Book downloads complete ===');
}

main().catch(console.error);
