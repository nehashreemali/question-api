/**
 * Seed TV show topics for all subcategories
 */

import { ensureTopic, getTopics, initRegistry } from '../src/lib/registry';

initRegistry();

// Get existing topics to avoid duplicates
const existingTopics = getTopics('tv-shows');
const existingSlugs = new Set(existingTopics.map(t => t.slug));

const tvShows: Record<string, Array<{ name: string; slug: string; totalEpisodes?: number }>> = {
  sitcoms: [
    // Already have: Friends, TBBT, Arrested Development, Brooklyn Nine-Nine, Community,
    // Curb Your Enthusiasm, HIMYM, It's Always Sunny, Modern Family, New Girl,
    // Parks and Rec, Schitt's Creek, Seinfeld, The Good Place, The Office US
    { name: "30 Rock", slug: "30-rock", totalEpisodes: 138 },
    { name: "Cheers", slug: "cheers", totalEpisodes: 275 },
    { name: "Frasier", slug: "frasier", totalEpisodes: 264 },
    { name: "Fresh Prince of Bel-Air", slug: "fresh-prince", totalEpisodes: 148 },
    { name: "Happy Endings", slug: "happy-endings", totalEpisodes: 57 },
    { name: "It Crowd", slug: "it-crowd", totalEpisodes: 25 },
    { name: "Malcolm in the Middle", slug: "malcolm-in-the-middle", totalEpisodes: 151 },
    { name: "Married... with Children", slug: "married-with-children", totalEpisodes: 259 },
    { name: "My Name Is Earl", slug: "my-name-is-earl", totalEpisodes: 96 },
    { name: "Everybody Loves Raymond", slug: "everybody-loves-raymond", totalEpisodes: 210 },
    { name: "Scrubs", slug: "scrubs", totalEpisodes: 182 },
    { name: "Silicon Valley", slug: "silicon-valley", totalEpisodes: 53 },
    { name: "Superstore", slug: "superstore", totalEpisodes: 113 },
    { name: "Ted Lasso", slug: "ted-lasso", totalEpisodes: 34 },
    { name: "That '70s Show", slug: "that-70s-show", totalEpisodes: 200 },
    { name: "The Goldbergs", slug: "the-goldbergs", totalEpisodes: 229 },
    { name: "The Middle", slug: "the-middle", totalEpisodes: 215 },
    { name: "Two and a Half Men", slug: "two-and-a-half-men", totalEpisodes: 262 },
    { name: "Veep", slug: "veep", totalEpisodes: 65 },
    { name: "What We Do in the Shadows", slug: "what-we-do-in-the-shadows", totalEpisodes: 51 },
    { name: "Will & Grace", slug: "will-and-grace", totalEpisodes: 246 },
    { name: "Workaholics", slug: "workaholics", totalEpisodes: 86 },
    { name: "Young Sheldon", slug: "young-sheldon", totalEpisodes: 141 },
    { name: "Abbott Elementary", slug: "abbott-elementary", totalEpisodes: 47 },
    { name: "Only Fools and Horses", slug: "only-fools-and-horses", totalEpisodes: 64 },
    { name: "The Inbetweeners", slug: "the-inbetweeners", totalEpisodes: 18 },
    { name: "Peep Show", slug: "peep-show", totalEpisodes: 54 },
    { name: "Blackadder", slug: "blackadder", totalEpisodes: 26 },
    { name: "Ghosts (UK)", slug: "ghosts-uk", totalEpisodes: 37 },
    { name: "Derry Girls", slug: "derry-girls", totalEpisodes: 19 },
  ],

  drama: [
    // Already have: Better Call Saul, Breaking Bad, Downton Abbey, GoT, Grey's Anatomy,
    // House of Cards, Mad Men, Ozark, Peaky Blinders, Succession, The Crown,
    // The Sopranos, The Walking Dead, The Wire, This Is Us
    { name: "24", slug: "24", totalEpisodes: 204 },
    { name: "Billions", slug: "billions", totalEpisodes: 84 },
    { name: "Boardwalk Empire", slug: "boardwalk-empire", totalEpisodes: 56 },
    { name: "Dexter", slug: "dexter-drama", totalEpisodes: 96 },
    { name: "ER", slug: "er", totalEpisodes: 331 },
    { name: "Friday Night Lights", slug: "friday-night-lights", totalEpisodes: 76 },
    { name: "Homeland", slug: "homeland", totalEpisodes: 96 },
    { name: "House M.D.", slug: "house-md", totalEpisodes: 177 },
    { name: "Justified", slug: "justified", totalEpisodes: 78 },
    { name: "Lost", slug: "lost", totalEpisodes: 121 },
    { name: "Narcos", slug: "narcos-drama", totalEpisodes: 30 },
    { name: "Prison Break", slug: "prison-break-drama", totalEpisodes: 90 },
    { name: "Shameless (US)", slug: "shameless-us", totalEpisodes: 134 },
    { name: "Six Feet Under", slug: "six-feet-under", totalEpisodes: 63 },
    { name: "Sons of Anarchy", slug: "sons-of-anarchy", totalEpisodes: 92 },
    { name: "Suits", slug: "suits", totalEpisodes: 134 },
    { name: "The Americans", slug: "the-americans", totalEpisodes: 75 },
    { name: "The Good Wife", slug: "the-good-wife", totalEpisodes: 156 },
    { name: "The Handmaid's Tale", slug: "the-handmaids-tale", totalEpisodes: 56 },
    { name: "The Leftovers", slug: "the-leftovers", totalEpisodes: 28 },
    { name: "The Shield", slug: "the-shield", totalEpisodes: 88 },
    { name: "The West Wing", slug: "the-west-wing", totalEpisodes: 154 },
    { name: "Vikings", slug: "vikings", totalEpisodes: 89 },
    { name: "Yellowstone", slug: "yellowstone", totalEpisodes: 53 },
    { name: "The Bear", slug: "the-bear", totalEpisodes: 28 },
    { name: "Severance", slug: "severance", totalEpisodes: 19 },
    { name: "Shogun (2024)", slug: "shogun-2024", totalEpisodes: 10 },
    { name: "Slow Horses", slug: "slow-horses", totalEpisodes: 24 },
  ],

  animated: [
    // Already have: Adventure Time, Arcane, Avatar TLA, BoJack, Family Guy,
    // Futurama, Rick and Morty, South Park, The Simpsons
    { name: "American Dad", slug: "american-dad", totalEpisodes: 342 },
    { name: "Archer", slug: "archer", totalEpisodes: 144 },
    { name: "Big Mouth", slug: "big-mouth", totalEpisodes: 71 },
    { name: "Bob's Burgers", slug: "bobs-burgers", totalEpisodes: 269 },
    { name: "Clone High", slug: "clone-high", totalEpisodes: 33 },
    { name: "Gravity Falls", slug: "gravity-falls", totalEpisodes: 40 },
    { name: "Invincible", slug: "invincible", totalEpisodes: 17 },
    { name: "King of the Hill", slug: "king-of-the-hill", totalEpisodes: 259 },
    { name: "Regular Show", slug: "regular-show", totalEpisodes: 261 },
    { name: "SpongeBob SquarePants", slug: "spongebob", totalEpisodes: 281 },
    { name: "The Cleveland Show", slug: "the-cleveland-show", totalEpisodes: 88 },
    { name: "The Legend of Korra", slug: "legend-of-korra", totalEpisodes: 52 },
    { name: "The Venture Bros", slug: "venture-bros", totalEpisodes: 86 },
    { name: "Bluey", slug: "bluey", totalEpisodes: 154 },
    { name: "Aqua Teen Hunger Force", slug: "aqua-teen-hunger-force", totalEpisodes: 139 },
    { name: "Beavis and Butt-Head", slug: "beavis-and-butthead", totalEpisodes: 222 },
    { name: "Daria", slug: "daria", totalEpisodes: 65 },
    { name: "Batman: The Animated Series", slug: "batman-tas", totalEpisodes: 85 },
    { name: "X-Men: The Animated Series", slug: "x-men-tas", totalEpisodes: 76 },
    { name: "Primal", slug: "primal", totalEpisodes: 20 },
    { name: "Castlevania", slug: "castlevania", totalEpisodes: 32 },
    { name: "Demon Slayer", slug: "demon-slayer", totalEpisodes: 55 },
    { name: "Attack on Titan", slug: "attack-on-titan", totalEpisodes: 94 },
    { name: "Death Note", slug: "death-note", totalEpisodes: 37 },
    { name: "One Punch Man", slug: "one-punch-man", totalEpisodes: 24 },
  ],

  "crime-thriller": [
    // Already have: Dexter, Fargo, Hannibal, Killing Eve, Mindhunter,
    // Money Heist, Narcos, Prison Break, Sherlock, True Detective
    { name: "Better Call Saul", slug: "better-call-saul-crime", totalEpisodes: 63 },
    { name: "Bosch", slug: "bosch", totalEpisodes: 68 },
    { name: "Breaking Bad", slug: "breaking-bad-crime", totalEpisodes: 62 },
    { name: "Broadchurch", slug: "broadchurch", totalEpisodes: 24 },
    { name: "Criminal Minds", slug: "criminal-minds", totalEpisodes: 324 },
    { name: "CSI: Crime Scene Investigation", slug: "csi", totalEpisodes: 337 },
    { name: "Justified", slug: "justified-crime", totalEpisodes: 78 },
    { name: "Law & Order", slug: "law-and-order", totalEpisodes: 501 },
    { name: "Law & Order: SVU", slug: "law-and-order-svu", totalEpisodes: 561 },
    { name: "Luther", slug: "luther", totalEpisodes: 20 },
    { name: "Mare of Easttown", slug: "mare-of-easttown", totalEpisodes: 7 },
    { name: "NCIS", slug: "ncis", totalEpisodes: 484 },
    { name: "Ozark", slug: "ozark-crime", totalEpisodes: 44 },
    { name: "Peaky Blinders", slug: "peaky-blinders-crime", totalEpisodes: 36 },
    { name: "Person of Interest", slug: "person-of-interest", totalEpisodes: 103 },
    { name: "The Blacklist", slug: "the-blacklist", totalEpisodes: 218 },
    { name: "The Bridge", slug: "the-bridge", totalEpisodes: 38 },
    { name: "The Killing", slug: "the-killing", totalEpisodes: 44 },
    { name: "The Mentalist", slug: "the-mentalist", totalEpisodes: 151 },
    { name: "White Collar", slug: "white-collar", totalEpisodes: 81 },
    { name: "Line of Duty", slug: "line-of-duty", totalEpisodes: 36 },
    { name: "Bodyguard", slug: "bodyguard", totalEpisodes: 6 },
    { name: "The Night Of", slug: "the-night-of", totalEpisodes: 8 },
    { name: "Barry", slug: "barry", totalEpisodes: 32 },
  ],

  "sci-fi-fantasy": [
    // Already have: Black Mirror, Doctor Who, House of the Dragon, Loki,
    // Star Trek TNG, Stranger Things, The Boys, The Expanse, The Mandalorian,
    // The Witcher, WandaVision, Westworld
    { name: "Battlestar Galactica", slug: "battlestar-galactica", totalEpisodes: 75 },
    { name: "Buffy the Vampire Slayer", slug: "buffy", totalEpisodes: 144 },
    { name: "Dark", slug: "dark", totalEpisodes: 26 },
    { name: "Firefly", slug: "firefly", totalEpisodes: 14 },
    { name: "Fringe", slug: "fringe", totalEpisodes: 100 },
    { name: "Lost", slug: "lost-scifi", totalEpisodes: 121 },
    { name: "Orphan Black", slug: "orphan-black", totalEpisodes: 50 },
    { name: "Star Trek: Deep Space Nine", slug: "star-trek-ds9", totalEpisodes: 176 },
    { name: "Star Trek: Voyager", slug: "star-trek-voyager", totalEpisodes: 172 },
    { name: "Star Trek: Discovery", slug: "star-trek-discovery", totalEpisodes: 65 },
    { name: "Star Trek: Strange New Worlds", slug: "star-trek-snw", totalEpisodes: 20 },
    { name: "Supernatural", slug: "supernatural", totalEpisodes: 327 },
    { name: "The 100", slug: "the-100", totalEpisodes: 100 },
    { name: "The Twilight Zone", slug: "twilight-zone", totalEpisodes: 156 },
    { name: "The X-Files", slug: "x-files", totalEpisodes: 218 },
    { name: "True Blood", slug: "true-blood", totalEpisodes: 80 },
    { name: "The Umbrella Academy", slug: "umbrella-academy", totalEpisodes: 40 },
    { name: "For All Mankind", slug: "for-all-mankind", totalEpisodes: 40 },
    { name: "Foundation", slug: "foundation", totalEpisodes: 20 },
    { name: "Silo", slug: "silo", totalEpisodes: 10 },
    { name: "3 Body Problem", slug: "3-body-problem", totalEpisodes: 8 },
    { name: "Fallout", slug: "fallout", totalEpisodes: 8 },
    { name: "The Last of Us", slug: "the-last-of-us", totalEpisodes: 9 },
    { name: "Andor", slug: "andor", totalEpisodes: 12 },
    { name: "Ahsoka", slug: "ahsoka", totalEpisodes: 8 },
  ],

  "classic-tv": [
    { name: "M*A*S*H", slug: "mash", totalEpisodes: 256 },
    { name: "I Love Lucy", slug: "i-love-lucy", totalEpisodes: 181 },
    { name: "The Andy Griffith Show", slug: "andy-griffith-show", totalEpisodes: 249 },
    { name: "All in the Family", slug: "all-in-the-family", totalEpisodes: 205 },
    { name: "The Mary Tyler Moore Show", slug: "mary-tyler-moore", totalEpisodes: 168 },
    { name: "Happy Days", slug: "happy-days", totalEpisodes: 255 },
    { name: "Taxi", slug: "taxi", totalEpisodes: 114 },
    { name: "The Cosby Show", slug: "the-cosby-show", totalEpisodes: 201 },
    { name: "Miami Vice", slug: "miami-vice", totalEpisodes: 111 },
    { name: "Magnum P.I.", slug: "magnum-pi", totalEpisodes: 162 },
    { name: "Knight Rider", slug: "knight-rider", totalEpisodes: 90 },
    { name: "The A-Team", slug: "the-a-team", totalEpisodes: 98 },
    { name: "Dallas", slug: "dallas", totalEpisodes: 357 },
    { name: "Dynasty", slug: "dynasty-classic", totalEpisodes: 220 },
    { name: "Murder, She Wrote", slug: "murder-she-wrote", totalEpisodes: 264 },
    { name: "Columbo", slug: "columbo", totalEpisodes: 69 },
    { name: "The Twilight Zone (Original)", slug: "twilight-zone-original", totalEpisodes: 156 },
    { name: "Star Trek: The Original Series", slug: "star-trek-tos", totalEpisodes: 79 },
    { name: "The Jeffersons", slug: "the-jeffersons", totalEpisodes: 253 },
    { name: "Sanford and Son", slug: "sanford-and-son", totalEpisodes: 136 },
    { name: "Golden Girls", slug: "golden-girls", totalEpisodes: 180 },
    { name: "Diff'rent Strokes", slug: "diffrent-strokes", totalEpisodes: 189 },
    { name: "The Facts of Life", slug: "facts-of-life", totalEpisodes: 201 },
    { name: "Family Ties", slug: "family-ties", totalEpisodes: 176 },
    { name: "Growing Pains", slug: "growing-pains", totalEpisodes: 166 },
  ],

  documentary: [
    { name: "Planet Earth", slug: "planet-earth", totalEpisodes: 22 },
    { name: "Blue Planet", slug: "blue-planet", totalEpisodes: 16 },
    { name: "Our Planet", slug: "our-planet", totalEpisodes: 12 },
    { name: "Cosmos: A Spacetime Odyssey", slug: "cosmos", totalEpisodes: 26 },
    { name: "Making a Murderer", slug: "making-a-murderer", totalEpisodes: 20 },
    { name: "The Jinx", slug: "the-jinx", totalEpisodes: 12 },
    { name: "Tiger King", slug: "tiger-king", totalEpisodes: 11 },
    { name: "Wild Wild Country", slug: "wild-wild-country", totalEpisodes: 6 },
    { name: "The Last Dance", slug: "the-last-dance", totalEpisodes: 10 },
    { name: "Drive to Survive", slug: "drive-to-survive", totalEpisodes: 60 },
    { name: "Chef's Table", slug: "chefs-table", totalEpisodes: 47 },
    { name: "Abstract: The Art of Design", slug: "abstract", totalEpisodes: 14 },
    { name: "The Defiant Ones", slug: "the-defiant-ones", totalEpisodes: 4 },
    { name: "O.J.: Made in America", slug: "oj-made-in-america", totalEpisodes: 5 },
    { name: "The Staircase", slug: "the-staircase", totalEpisodes: 13 },
    { name: "Dirty Money", slug: "dirty-money", totalEpisodes: 12 },
    { name: "Explained", slug: "explained", totalEpisodes: 55 },
    { name: "The Social Dilemma", slug: "the-social-dilemma", totalEpisodes: 1 },
    { name: "Chernobyl (Docudrama)", slug: "chernobyl", totalEpisodes: 5 },
    { name: "Band of Brothers", slug: "band-of-brothers", totalEpisodes: 10 },
    { name: "The Pacific", slug: "the-pacific", totalEpisodes: 10 },
    { name: "How It's Made", slug: "how-its-made", totalEpisodes: 400 },
    { name: "MythBusters", slug: "mythbusters", totalEpisodes: 282 },
  ],

  reality: [
    { name: "Survivor", slug: "survivor", totalEpisodes: 640 },
    { name: "The Amazing Race", slug: "amazing-race", totalEpisodes: 388 },
    { name: "Big Brother", slug: "big-brother", totalEpisodes: 900 },
    { name: "American Idol", slug: "american-idol", totalEpisodes: 582 },
    { name: "The Voice", slug: "the-voice", totalEpisodes: 500 },
    { name: "America's Got Talent", slug: "americas-got-talent", totalEpisodes: 350 },
    { name: "Dancing with the Stars", slug: "dancing-with-the-stars", totalEpisodes: 450 },
    { name: "Project Runway", slug: "project-runway", totalEpisodes: 272 },
    { name: "Top Chef", slug: "top-chef", totalEpisodes: 283 },
    { name: "Hell's Kitchen", slug: "hells-kitchen", totalEpisodes: 361 },
    { name: "MasterChef", slug: "masterchef", totalEpisodes: 238 },
    { name: "The Bachelor", slug: "the-bachelor", totalEpisodes: 350 },
    { name: "The Bachelorette", slug: "the-bachelorette", totalEpisodes: 260 },
    { name: "Love Island", slug: "love-island", totalEpisodes: 500 },
    { name: "Keeping Up with the Kardashians", slug: "kardashians", totalEpisodes: 283 },
    { name: "RuPaul's Drag Race", slug: "rupauls-drag-race", totalEpisodes: 220 },
    { name: "Queer Eye", slug: "queer-eye", totalEpisodes: 70 },
    { name: "Shark Tank", slug: "shark-tank", totalEpisodes: 346 },
    { name: "The Great British Bake Off", slug: "great-british-bake-off", totalEpisodes: 152 },
    { name: "Squid Game: The Challenge", slug: "squid-game-challenge", totalEpisodes: 10 },
    { name: "The Traitors", slug: "the-traitors", totalEpisodes: 22 },
    { name: "The Circle", slug: "the-circle", totalEpisodes: 52 },
    { name: "Below Deck", slug: "below-deck", totalEpisodes: 200 },
  ],

  "talk-shows": [
    { name: "The Tonight Show (Johnny Carson)", slug: "tonight-show-carson", totalEpisodes: 4531 },
    { name: "The Tonight Show (Jimmy Fallon)", slug: "tonight-show-fallon", totalEpisodes: 1500 },
    { name: "Late Show with David Letterman", slug: "late-show-letterman", totalEpisodes: 4000 },
    { name: "Late Show with Stephen Colbert", slug: "late-show-colbert", totalEpisodes: 1200 },
    { name: "The Late Late Show (James Corden)", slug: "late-late-show-corden", totalEpisodes: 1200 },
    { name: "Jimmy Kimmel Live", slug: "jimmy-kimmel-live", totalEpisodes: 3500 },
    { name: "Conan", slug: "conan", totalEpisodes: 1500 },
    { name: "The Daily Show", slug: "the-daily-show", totalEpisodes: 4000 },
    { name: "Last Week Tonight", slug: "last-week-tonight", totalEpisodes: 350 },
    { name: "Saturday Night Live", slug: "snl", totalEpisodes: 950 },
    { name: "The Ellen DeGeneres Show", slug: "ellen", totalEpisodes: 3200 },
    { name: "The Oprah Winfrey Show", slug: "oprah", totalEpisodes: 4561 },
    { name: "The Graham Norton Show", slug: "graham-norton", totalEpisodes: 600 },
    { name: "Hot Ones", slug: "hot-ones", totalEpisodes: 350 },
    { name: "The Joe Rogan Experience", slug: "joe-rogan", totalEpisodes: 2100 },
    { name: "Between Two Ferns", slug: "between-two-ferns", totalEpisodes: 21 },
    { name: "Comedians in Cars Getting Coffee", slug: "comedians-in-cars", totalEpisodes: 84 },
    { name: "The View", slug: "the-view", totalEpisodes: 5000 },
    { name: "Good Morning America", slug: "good-morning-america", totalEpisodes: 10000 },
    { name: "Today Show", slug: "today-show", totalEpisodes: 15000 },
  ],

  awards: [
    // Already have: Emmy Awards
    { name: "Golden Globes TV", slug: "golden-globes-tv" },
    { name: "SAG Awards TV", slug: "sag-awards-tv" },
    { name: "Critics Choice TV", slug: "critics-choice-tv" },
    { name: "BAFTA TV", slug: "bafta-tv" },
    { name: "Peabody Awards", slug: "peabody-awards" },
    { name: "Television Academy Hall of Fame", slug: "tv-hall-of-fame" },
  ],
};

let added = 0;
let skipped = 0;

for (const [subcategory, shows] of Object.entries(tvShows)) {
  console.log(`\n${subcategory}:`);

  for (const show of shows) {
    if (existingSlugs.has(show.slug)) {
      console.log(`  - ${show.name} (exists)`);
      skipped++;
      continue;
    }

    ensureTopic({
      category: 'tv-shows',
      subcategory,
      slug: show.slug,
      name: show.name,
      total_parts: show.totalEpisodes || 0,
      source_type: 'transcript',
    });

    console.log(`  + ${show.name}`);
    added++;
  }
}

console.log(`\n✓ Added: ${added} shows`);
console.log(`- Skipped: ${skipped} (already exist)`);

// Final count
const allTopics = getTopics('tv-shows');
console.log(`\nTotal TV show topics: ${allTopics.length}`);
