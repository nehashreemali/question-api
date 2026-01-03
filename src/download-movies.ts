/**
 * Movie script downloader - Springfield! Springfield!
 * Usage: bun src/download-movies.ts
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('movies');

interface MovieConfig {
  title: string;
  slug: string;
  year?: number;
}

// Top 200 movies for V1
const MOVIES: MovieConfig[] = [
  // Action/Adventure
  { title: 'The Dark Knight', slug: 'dark-knight-the-batman-the-dark-knight', year: 2008 },
  { title: 'Inception', slug: 'inception', year: 2010 },
  { title: 'Gladiator', slug: 'gladiator', year: 2000 },
  { title: 'Mad Max: Fury Road', slug: 'mad-max-fury-road', year: 2015 },
  { title: 'The Matrix', slug: 'matrix-the', year: 1999 },
  { title: 'Die Hard', slug: 'die-hard', year: 1988 },
  { title: 'John Wick', slug: 'john-wick', year: 2014 },
  { title: 'Top Gun', slug: 'top-gun', year: 1986 },
  { title: 'Indiana Jones Raiders', slug: 'raiders-of-the-lost-ark', year: 1981 },
  { title: 'Jurassic Park', slug: 'jurassic-park', year: 1993 },

  // Drama
  { title: 'The Godfather', slug: 'godfather-the', year: 1972 },
  { title: 'The Godfather Part II', slug: 'godfather-part-ii-the', year: 1974 },
  { title: 'The Shawshank Redemption', slug: 'shawshank-redemption-the', year: 1994 },
  { title: 'Pulp Fiction', slug: 'pulp-fiction', year: 1994 },
  { title: 'Fight Club', slug: 'fight-club', year: 1999 },
  { title: 'Forrest Gump', slug: 'forrest-gump', year: 1994 },
  { title: 'The Social Network', slug: 'social-network-the', year: 2010 },
  { title: 'Whiplash', slug: 'whiplash', year: 2014 },
  { title: 'Good Will Hunting', slug: 'good-will-hunting', year: 1997 },
  { title: 'A Beautiful Mind', slug: 'beautiful-mind-a', year: 2001 },

  // Comedy
  { title: 'Superbad', slug: 'superbad', year: 2007 },
  { title: 'The Hangover', slug: 'hangover-the', year: 2009 },
  { title: 'Mean Girls', slug: 'mean-girls', year: 2004 },
  { title: 'The Big Lebowski', slug: 'big-lebowski-the', year: 1998 },
  { title: 'Ferris Buellers Day Off', slug: 'ferris-buellers-day-off', year: 1986 },
  { title: 'Groundhog Day', slug: 'groundhog-day', year: 1993 },
  { title: 'Home Alone', slug: 'home-alone', year: 1990 },
  { title: 'Bridesmaids', slug: 'bridesmaids', year: 2011 },
  { title: 'Step Brothers', slug: 'step-brothers', year: 2008 },
  { title: 'Anchorman', slug: 'anchorman-the-legend-of-ron-burgundy', year: 2004 },

  // Sci-Fi
  { title: 'Star Wars A New Hope', slug: 'star-wars', year: 1977 },
  { title: 'The Empire Strikes Back', slug: 'star-wars-episode-v-the-empire-strikes-back', year: 1980 },
  { title: 'Return of the Jedi', slug: 'star-wars-episode-vi-return-of-the-jedi', year: 1983 },
  { title: 'Interstellar', slug: 'interstellar', year: 2014 },
  { title: 'Blade Runner', slug: 'blade-runner', year: 1982 },
  { title: 'Alien', slug: 'alien', year: 1979 },
  { title: 'E.T.', slug: 'e-t-the-extra-terrestrial', year: 1982 },
  { title: 'Back to the Future', slug: 'back-to-the-future', year: 1985 },
  { title: 'The Terminator', slug: 'terminator-the', year: 1984 },
  { title: 'Terminator 2', slug: 'terminator-2-judgment-day', year: 1991 },

  // Marvel/DC
  { title: 'Iron Man', slug: 'iron-man', year: 2008 },
  { title: 'The Avengers', slug: 'avengers-the-2012', year: 2012 },
  { title: 'Avengers Endgame', slug: 'avengers-endgame', year: 2019 },
  { title: 'Avengers Infinity War', slug: 'avengers-infinity-war', year: 2018 },
  { title: 'Black Panther', slug: 'black-panther', year: 2018 },
  { title: 'Spider-Man Homecoming', slug: 'spider-man-homecoming', year: 2017 },
  { title: 'Guardians of the Galaxy', slug: 'guardians-of-the-galaxy', year: 2014 },
  { title: 'Thor Ragnarok', slug: 'thor-ragnarok', year: 2017 },
  { title: 'Captain America Winter Soldier', slug: 'captain-america-the-winter-soldier', year: 2014 },
  { title: 'Joker', slug: 'joker-2019', year: 2019 },

  // Horror/Thriller
  { title: 'The Silence of the Lambs', slug: 'silence-of-the-lambs-the', year: 1991 },
  { title: 'Se7en', slug: 'se7en-seven', year: 1995 },
  { title: 'Get Out', slug: 'get-out', year: 2017 },
  { title: 'The Shining', slug: 'shining-the', year: 1980 },
  { title: 'Jaws', slug: 'jaws', year: 1975 },
  { title: 'Scream', slug: 'scream', year: 1996 },
  { title: 'A Quiet Place', slug: 'a-quiet-place', year: 2018 },
  { title: 'The Sixth Sense', slug: 'sixth-sense-the', year: 1999 },
  { title: 'Psycho', slug: 'psycho', year: 1960 },
  { title: 'It', slug: 'it', year: 2017 },

  // Animation
  { title: 'Toy Story', slug: 'toy-story', year: 1995 },
  { title: 'Finding Nemo', slug: 'finding-nemo', year: 2003 },
  { title: 'The Lion King', slug: 'lion-king-the', year: 1994 },
  { title: 'Shrek', slug: 'shrek', year: 2001 },
  { title: 'Up', slug: 'up', year: 2009 },
  { title: 'WALL-E', slug: 'wall-e', year: 2008 },
  { title: 'Coco', slug: 'coco', year: 2017 },
  { title: 'The Incredibles', slug: 'incredibles-the', year: 2004 },
  { title: 'Monsters Inc', slug: 'monsters-inc', year: 2001 },
  { title: 'Inside Out', slug: 'inside-out', year: 2015 },

  // LOTR/Fantasy
  { title: 'LOTR Fellowship', slug: 'lord-of-the-rings-the-fellowship-of-the-ring-the', year: 2001 },
  { title: 'LOTR Two Towers', slug: 'lord-of-the-rings-the-two-towers-the', year: 2002 },
  { title: 'LOTR Return of the King', slug: 'lord-of-the-rings-the-return-of-the-king-the', year: 2003 },
  { title: 'Harry Potter Sorcerers Stone', slug: 'harry-potter-and-the-sorcerers-stone', year: 2001 },
  { title: 'Harry Potter Chamber of Secrets', slug: 'harry-potter-and-the-chamber-of-secrets', year: 2002 },
  { title: 'Harry Potter Prisoner of Azkaban', slug: 'harry-potter-and-the-prisoner-of-azkaban', year: 2004 },

  // More classics
  { title: 'Schindlers List', slug: 'schindlers-list', year: 1993 },
  { title: 'Saving Private Ryan', slug: 'saving-private-ryan', year: 1998 },
  { title: 'The Departed', slug: 'departed-the', year: 2006 },
  { title: 'No Country for Old Men', slug: 'no-country-for-old-men', year: 2007 },
  { title: 'There Will Be Blood', slug: 'there-will-be-blood', year: 2007 },
  { title: 'Titanic', slug: 'titanic', year: 1997 },
  { title: 'The Green Mile', slug: 'green-mile-the', year: 1999 },
  { title: 'Braveheart', slug: 'braveheart', year: 1995 },
  { title: 'The Prestige', slug: 'prestige-the', year: 2006 },
  { title: 'Django Unchained', slug: 'django-unchained', year: 2012 },

  // Wave 2 - More popular films
  // More Marvel/DC
  { title: 'The Dark Knight Rises', slug: 'dark-knight-rises-the', year: 2012 },
  { title: 'Batman Begins', slug: 'batman-begins', year: 2005 },
  { title: 'Wonder Woman', slug: 'wonder-woman-2017', year: 2017 },
  { title: 'Deadpool', slug: 'deadpool', year: 2016 },
  { title: 'Logan', slug: 'logan', year: 2017 },
  { title: 'Spider-Man No Way Home', slug: 'spider-man-no-way-home', year: 2021 },
  { title: 'Doctor Strange', slug: 'doctor-strange-2016', year: 2016 },
  { title: 'Ant-Man', slug: 'ant-man', year: 2015 },
  { title: 'Captain Marvel', slug: 'captain-marvel', year: 2019 },
  { title: 'Shazam', slug: 'shazam', year: 2019 },

  // More Sci-Fi
  { title: 'Arrival', slug: 'arrival', year: 2016 },
  { title: 'The Martian', slug: 'the-martian', year: 2015 },
  { title: 'Dune', slug: 'dune-part-one', year: 2021 },
  { title: 'Gravity', slug: 'gravity', year: 2013 },
  { title: 'District 9', slug: 'district-9', year: 2009 },
  { title: 'Edge of Tomorrow', slug: 'edge-of-tomorrow', year: 2014 },
  { title: 'Ex Machina', slug: 'ex-machina', year: 2015 },
  { title: 'Blade Runner 2049', slug: 'blade-runner-2049', year: 2017 },
  { title: 'Avatar', slug: 'avatar', year: 2009 },
  { title: 'The Fifth Element', slug: 'fifth-element-the', year: 1997 },

  // More Comedy
  { title: 'The 40-Year-Old Virgin', slug: '40-year-old-virgin-the', year: 2005 },
  { title: 'Tropic Thunder', slug: 'tropic-thunder', year: 2008 },
  { title: 'Knocked Up', slug: 'knocked-up', year: 2007 },
  { title: 'Elf', slug: 'elf', year: 2003 },
  { title: 'Dumb and Dumber', slug: 'dumb-dumber', year: 1994 },
  { title: 'Napoleon Dynamite', slug: 'napoleon-dynamite', year: 2004 },
  { title: 'Office Space', slug: 'office-space', year: 1999 },
  { title: 'Zoolander', slug: 'zoolander', year: 2001 },
  { title: 'Borat', slug: 'borat-cultural-learnings-of-america-for-make-benefit-glorious-nation-of-kazakhstan', year: 2006 },
  { title: 'Wedding Crashers', slug: 'wedding-crashers', year: 2005 },

  // More Drama/Thriller
  { title: 'Gone Girl', slug: 'gone-girl', year: 2014 },
  { title: 'Zodiac', slug: 'zodiac', year: 2007 },
  { title: 'Prisoners', slug: 'prisoners', year: 2013 },
  { title: 'Nightcrawler', slug: 'nightcrawler', year: 2014 },
  { title: 'The Wolf of Wall Street', slug: 'the-wolf-of-wall-street', year: 2013 },
  { title: 'American Psycho', slug: 'american-psycho', year: 2000 },
  { title: 'Memento', slug: 'memento', year: 2000 },
  { title: 'Shutter Island', slug: 'shutter-island', year: 2010 },
  { title: 'The Usual Suspects', slug: 'usual-suspects-the', year: 1995 },
  { title: 'Heat', slug: 'heat', year: 1995 },

  // More Horror
  { title: 'Hereditary', slug: 'hereditary', year: 2018 },
  { title: 'Us', slug: 'us', year: 2019 },
  { title: 'The Conjuring', slug: 'the-conjuring', year: 2013 },
  { title: 'A Nightmare on Elm Street', slug: 'nightmare-on-elm-street-a', year: 1984 },
  { title: 'Halloween', slug: 'halloween', year: 1978 },
  { title: 'The Exorcist', slug: 'exorcist-the', year: 1973 },
  { title: 'Midsommar', slug: 'midsommar', year: 2019 },
  { title: 'The Babadook', slug: 'the-babadook', year: 2014 },
  { title: 'It Follows', slug: 'it-follows', year: 2015 },
  { title: '28 Days Later', slug: '28-days-later', year: 2002 },

  // More Animation
  { title: 'Ratatouille', slug: 'ratatouille', year: 2007 },
  { title: 'Frozen', slug: 'frozen-2013', year: 2013 },
  { title: 'Moana', slug: 'moana', year: 2016 },
  { title: 'Zootopia', slug: 'zootopia', year: 2016 },
  { title: 'How to Train Your Dragon', slug: 'how-to-train-your-dragon', year: 2010 },
  { title: 'Spider-Man Into the Spider-Verse', slug: 'spider-man-into-the-spider-verse', year: 2018 },
  { title: 'Toy Story 3', slug: 'toy-story-3', year: 2010 },
  { title: 'Finding Dory', slug: 'finding-dory', year: 2016 },
  { title: 'The Lego Movie', slug: 'the-lego-movie', year: 2014 },
  { title: 'Despicable Me', slug: 'despicable-me', year: 2010 },

  // More Harry Potter
  { title: 'Harry Potter Goblet of Fire', slug: 'harry-potter-and-the-goblet-of-fire', year: 2005 },
  { title: 'Harry Potter Order of Phoenix', slug: 'harry-potter-and-the-order-of-the-phoenix', year: 2007 },
  { title: 'Harry Potter Half-Blood Prince', slug: 'harry-potter-and-the-half-blood-prince', year: 2009 },
  { title: 'Harry Potter Deathly Hallows 1', slug: 'harry-potter-and-deathly-hallows-part-1', year: 2010 },
  { title: 'Harry Potter Deathly Hallows 2', slug: 'harry-potter-and-deathly-hallows-part-2', year: 2011 },

  // Classic Films
  { title: '12 Angry Men', slug: '12-angry-men', year: 1957 },
  { title: 'Casablanca', slug: 'casablanca', year: 1942 },
  { title: 'Citizen Kane', slug: 'citizen-kane', year: 1941 },
  { title: 'One Flew Over the Cuckoos Nest', slug: 'one-flew-over-the-cuckoos-nest', year: 1975 },
  { title: 'Taxi Driver', slug: 'taxi-driver', year: 1976 },
  { title: 'Goodfellas', slug: 'goodfellas', year: 1990 },
  { title: 'Scarface', slug: 'scarface-1983', year: 1983 },
  { title: 'The Breakfast Club', slug: 'breakfast-club-the', year: 1985 },
  { title: 'Dirty Dancing', slug: 'dirty-dancing', year: 1987 },
  { title: 'Pretty Woman', slug: 'pretty-woman', year: 1990 },

  // Recent hits
  { title: 'Parasite', slug: 'parasite-2019', year: 2019 },
  { title: 'Knives Out', slug: 'knives-out', year: 2019 },
  { title: 'Once Upon a Time in Hollywood', slug: 'once-upon-a-time-in-hollywood', year: 2019 },
  { title: '1917', slug: '1917', year: 2019 },
  { title: 'Jojo Rabbit', slug: 'jojo-rabbit', year: 2019 },
  { title: 'The Irishman', slug: 'the-irishman', year: 2019 },
  { title: 'Ford v Ferrari', slug: 'ford-v-ferrari', year: 2019 },
  { title: 'Marriage Story', slug: 'marriage-story', year: 2019 },
  { title: 'Oppenheimer', slug: 'oppenheimer', year: 2023 },
  { title: 'Barbie', slug: 'barbie', year: 2023 },
];

const rateLimiter = createRateLimiter(0.5);

async function scrapeMovie(movie: MovieConfig): Promise<any> {
  const url = `https://www.springfieldspringfield.co.uk/movie_script.php?movie=${movie.slug}`;

  logger.info(`Fetching: ${movie.title}`);

  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);

  const script = $('.scrolling-script-container').text().trim();

  if (!script || script.length < 500) {
    throw new Error('No script content found');
  }

  return {
    title: movie.title,
    slug: movie.slug,
    year: movie.year,
    script,
    source: 'Springfield! Springfield!',
    sourceUrl: url,
    scrapedAt: new Date().toISOString(),
    wordCount: script.split(/\s+/).length,
  };
}

function saveMovie(data: any): string {
  const dir = join(process.cwd(), 'generation', 'movies');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const filepath = join(dir, `${data.slug}.json`);
  writeFileSync(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

async function main() {
  logger.info(`Downloading ${MOVIES.length} movie scripts`);

  let success = 0, failed = 0, skipped = 0;

  for (const movie of MOVIES) {
    const filepath = join(process.cwd(), 'generation', 'movies', `${movie.slug}.json`);
    if (existsSync(filepath)) {
      skipped++;
      continue;
    }

    await rateLimiter();

    try {
      const data = await scrapeMovie(movie);
      saveMovie(data);
      success++;
      logger.success(`${movie.title} - ${data.wordCount} words`);
    } catch (e: any) {
      failed++;
      logger.error(`${movie.title} - ${e.message}`);
    }

    await sleep(500);
  }

  logger.info(`\nComplete: ${success} downloaded, ${skipped} skipped, ${failed} failed`);
}

main().catch(console.error);
