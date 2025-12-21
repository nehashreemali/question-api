/**
 * Seed topics from registry.json structure
 * This recreates the topics that were in the original registry
 */

import { ensureCategory, ensureSubcategory, ensureTopic, initRegistry } from '../src/lib/registry';

// Initialize registry
initRegistry();

// Registry data from the user's backup
const registryData = {
  "categories": [
    {
      "name": "TV Shows",
      "slug": "tv-shows",
      "subcategories": [
        {
          "name": "Sitcoms",
          "slug": "sitcoms",
          "topics": [
            { "name": "Friends", "slug": "friends", "totalEpisodes": 236 },
            { "name": "The Big Bang Theory", "slug": "the-big-bang-theory", "totalEpisodes": 279 },
            { "name": "Arrested Development", "slug": "arrested-development", "totalEpisodes": 84 },
            { "name": "Brooklyn Nine-Nine", "slug": "brooklyn-nine-nine", "totalEpisodes": 153 },
            { "name": "Community", "slug": "community", "totalEpisodes": 110 },
            { "name": "Curb Your Enthusiasm", "slug": "curb-your-enthusiasm", "totalEpisodes": 120 },
            { "name": "How I Met Your Mother", "slug": "how-i-met-your-mother", "totalEpisodes": 208 },
            { "name": "It's Always Sunny in Philadelphia", "slug": "its-always-sunny", "totalEpisodes": 172 },
            { "name": "Modern Family", "slug": "modern-family", "totalEpisodes": 250 },
            { "name": "New Girl", "slug": "new-girl", "totalEpisodes": 146 },
            { "name": "Parks and Recreation", "slug": "parks-and-recreation", "totalEpisodes": 125 },
            { "name": "Schitt's Creek", "slug": "schitts-creek", "totalEpisodes": 80 },
            { "name": "Seinfeld", "slug": "seinfeld", "totalEpisodes": 180 },
            { "name": "The Good Place", "slug": "the-good-place", "totalEpisodes": 53 },
            { "name": "The Office (US)", "slug": "the-office-us", "totalEpisodes": 201 }
          ]
        },
        {
          "name": "Animated",
          "slug": "animated",
          "topics": [
            { "name": "Adventure Time", "slug": "adventure-time", "totalEpisodes": 283 },
            { "name": "Arcane", "slug": "arcane", "totalEpisodes": 18 },
            { "name": "Avatar: The Last Airbender", "slug": "avatar-the-last-airbender", "totalEpisodes": 61 },
            { "name": "BoJack Horseman", "slug": "bojack-horseman", "totalEpisodes": 77 },
            { "name": "Family Guy", "slug": "family-guy", "totalEpisodes": 423 },
            { "name": "Futurama", "slug": "futurama", "totalEpisodes": 144 },
            { "name": "Rick and Morty", "slug": "rick-and-morty", "totalEpisodes": 71 },
            { "name": "South Park", "slug": "south-park", "totalEpisodes": 328 },
            { "name": "The Simpsons", "slug": "the-simpsons", "totalEpisodes": 768 }
          ]
        },
        {
          "name": "Crime & Thriller",
          "slug": "crime-thriller",
          "topics": [
            { "name": "Dexter", "slug": "dexter", "totalEpisodes": 96 },
            { "name": "Fargo", "slug": "fargo", "totalEpisodes": 51 },
            { "name": "Hannibal", "slug": "hannibal", "totalEpisodes": 39 },
            { "name": "Killing Eve", "slug": "killing-eve", "totalEpisodes": 32 },
            { "name": "Mindhunter", "slug": "mindhunter", "totalEpisodes": 19 },
            { "name": "Money Heist", "slug": "money-heist", "totalEpisodes": 41 },
            { "name": "Narcos", "slug": "narcos", "totalEpisodes": 30 },
            { "name": "Prison Break", "slug": "prison-break", "totalEpisodes": 90 },
            { "name": "Sherlock", "slug": "sherlock", "totalEpisodes": 15 },
            { "name": "True Detective", "slug": "true-detective", "totalEpisodes": 31 }
          ]
        },
        {
          "name": "Drama",
          "slug": "drama",
          "topics": [
            { "name": "Better Call Saul", "slug": "better-call-saul", "totalEpisodes": 63 },
            { "name": "Breaking Bad", "slug": "breaking-bad", "totalEpisodes": 62 },
            { "name": "Downton Abbey", "slug": "downton-abbey", "totalEpisodes": 52 },
            { "name": "Game of Thrones", "slug": "game-of-thrones", "totalEpisodes": 73 },
            { "name": "Grey's Anatomy", "slug": "greys-anatomy", "totalEpisodes": 428 },
            { "name": "House of Cards", "slug": "house-of-cards", "totalEpisodes": 73 },
            { "name": "Mad Men", "slug": "mad-men", "totalEpisodes": 92 },
            { "name": "Ozark", "slug": "ozark", "totalEpisodes": 44 },
            { "name": "Peaky Blinders", "slug": "peaky-blinders", "totalEpisodes": 36 },
            { "name": "Succession", "slug": "succession", "totalEpisodes": 39 },
            { "name": "The Crown", "slug": "the-crown", "totalEpisodes": 60 },
            { "name": "The Sopranos", "slug": "the-sopranos", "totalEpisodes": 86 },
            { "name": "The Walking Dead", "slug": "the-walking-dead", "totalEpisodes": 177 },
            { "name": "The Wire", "slug": "the-wire", "totalEpisodes": 60 },
            { "name": "This Is Us", "slug": "this-is-us", "totalEpisodes": 106 }
          ]
        },
        {
          "name": "Sci-Fi & Fantasy",
          "slug": "sci-fi-fantasy",
          "topics": [
            { "name": "Black Mirror", "slug": "black-mirror", "totalEpisodes": 27 },
            { "name": "Doctor Who", "slug": "doctor-who", "totalEpisodes": 167 },
            { "name": "House of the Dragon", "slug": "house-of-the-dragon", "totalEpisodes": 18 },
            { "name": "Loki", "slug": "loki", "totalEpisodes": 12 },
            { "name": "Star Trek: TNG", "slug": "star-trek-tng", "totalEpisodes": 178 },
            { "name": "Stranger Things", "slug": "stranger-things", "totalEpisodes": 34 },
            { "name": "The Boys", "slug": "the-boys", "totalEpisodes": 32 },
            { "name": "The Expanse", "slug": "the-expanse", "totalEpisodes": 62 },
            { "name": "The Mandalorian", "slug": "the-mandalorian", "totalEpisodes": 24 },
            { "name": "The Witcher", "slug": "the-witcher", "totalEpisodes": 24 },
            { "name": "WandaVision", "slug": "wandavision", "totalEpisodes": 9 },
            { "name": "Westworld", "slug": "westworld", "totalEpisodes": 36 }
          ]
        }
      ]
    },
    {
      "name": "Movies",
      "slug": "movies",
      "subcategories": [
        {
          "name": "By Genre",
          "slug": "genres",
          "topics": [
            { "name": "80s Classics", "slug": "80s-classics" },
            { "name": "90s Classics", "slug": "90s-classics" },
            { "name": "Action Blockbusters", "slug": "action-blockbusters" },
            { "name": "Animated Movies", "slug": "animated-movies" },
            { "name": "Classic Hollywood (Pre-1970)", "slug": "classic-hollywood" },
            { "name": "Documentary Films", "slug": "documentary-films" },
            { "name": "Horror Classics", "slug": "horror-classics" },
            { "name": "Oscar Best Pictures", "slug": "oscar-winners" },
            { "name": "Romantic Comedies", "slug": "romantic-comedies" }
          ]
        },
        {
          "name": "Franchises",
          "slug": "franchises",
          "topics": [
            { "name": "DC Extended Universe", "slug": "dc-extended-universe" },
            { "name": "Fast & Furious", "slug": "fast-and-furious" },
            { "name": "Harry Potter", "slug": "harry-potter" },
            { "name": "Indiana Jones", "slug": "indiana-jones" },
            { "name": "James Bond", "slug": "james-bond" },
            { "name": "Jurassic Park", "slug": "jurassic-park" },
            { "name": "Lord of the Rings", "slug": "lord-of-the-rings" },
            { "name": "Marvel Cinematic Universe", "slug": "marvel-mcu" },
            { "name": "Mission: Impossible", "slug": "mission-impossible" },
            { "name": "Pirates of the Caribbean", "slug": "pirates-of-the-caribbean" },
            { "name": "Star Wars", "slug": "star-wars" },
            { "name": "The Matrix", "slug": "the-matrix" }
          ]
        },
        {
          "name": "Studios",
          "slug": "studios",
          "topics": [
            { "name": "Disney Animation", "slug": "disney-animation" },
            { "name": "DreamWorks Animation", "slug": "dreamworks" },
            { "name": "Pixar", "slug": "pixar" },
            { "name": "Studio Ghibli", "slug": "studio-ghibli" }
          ]
        }
      ]
    },
    {
      "name": "Science",
      "slug": "science",
      "subcategories": [
        {
          "name": "Astronomy",
          "slug": "astronomy",
          "topics": [
            { "name": "Black Holes", "slug": "black-holes" },
            { "name": "Cosmology & Big Bang", "slug": "cosmology" },
            { "name": "Exoplanets", "slug": "exoplanets" },
            { "name": "Solar System", "slug": "solar-system" },
            { "name": "Space Exploration", "slug": "space-exploration" },
            { "name": "Stars & Galaxies", "slug": "stars-and-galaxies" }
          ]
        },
        {
          "name": "Biology",
          "slug": "biology",
          "topics": [
            { "name": "Botany (Plants)", "slug": "botany" },
            { "name": "Cell Biology", "slug": "cell-biology" },
            { "name": "Ecology", "slug": "ecology" },
            { "name": "Evolution", "slug": "evolution" },
            { "name": "Genetics & DNA", "slug": "genetics" },
            { "name": "Human Anatomy", "slug": "human-anatomy" },
            { "name": "Human Physiology", "slug": "human-physiology" },
            { "name": "Marine Biology", "slug": "marine-biology" },
            { "name": "Microbiology", "slug": "microbiology" },
            { "name": "Zoology (Animals)", "slug": "zoology" }
          ]
        },
        {
          "name": "Chemistry",
          "slug": "chemistry",
          "topics": [
            { "name": "Atomic Structure", "slug": "atomic-structure" },
            { "name": "Biochemistry", "slug": "biochemistry" },
            { "name": "Chemical Reactions", "slug": "chemical-reactions" },
            { "name": "Inorganic Chemistry", "slug": "inorganic-chemistry" },
            { "name": "Organic Chemistry", "slug": "organic-chemistry" },
            { "name": "Periodic Table & Elements", "slug": "periodic-table" },
            { "name": "Physical Chemistry", "slug": "physical-chemistry" }
          ]
        },
        {
          "name": "Earth Science",
          "slug": "earth-science",
          "topics": [
            { "name": "Climate Science", "slug": "climate-science" },
            { "name": "Geology", "slug": "geology" },
            { "name": "Meteorology & Weather", "slug": "meteorology" },
            { "name": "Oceanography", "slug": "oceanography" },
            { "name": "Volcanoes & Earthquakes", "slug": "volcanoes-earthquakes" }
          ]
        },
        {
          "name": "Physics",
          "slug": "physics",
          "topics": [
            { "name": "Classical Mechanics", "slug": "mechanics" },
            { "name": "Electromagnetism", "slug": "electromagnetism" },
            { "name": "Fluid Dynamics", "slug": "fluid-dynamics" },
            { "name": "Nuclear Physics", "slug": "nuclear-physics" },
            { "name": "Optics", "slug": "optics" },
            { "name": "Quantum Physics", "slug": "quantum-physics" },
            { "name": "Relativity", "slug": "relativity" },
            { "name": "Thermodynamics", "slug": "thermodynamics" },
            { "name": "Waves & Sound", "slug": "waves-and-sound" }
          ]
        }
      ]
    },
    {
      "name": "Mathematics",
      "slug": "mathematics",
      "subcategories": [
        {
          "name": "Advanced",
          "slug": "advanced",
          "topics": [
            { "name": "Calculus", "slug": "calculus" },
            { "name": "Discrete Mathematics", "slug": "discrete-math" },
            { "name": "Linear Algebra", "slug": "linear-algebra" },
            { "name": "Number Theory", "slug": "number-theory" },
            { "name": "Statistics & Probability", "slug": "statistics" }
          ]
        },
        {
          "name": "Applied",
          "slug": "applied",
          "topics": [
            { "name": "Famous Mathematicians", "slug": "famous-mathematicians" },
            { "name": "Famous Theorems", "slug": "famous-theorems" },
            { "name": "Mathematical Puzzles", "slug": "mathematical-puzzles" }
          ]
        },
        {
          "name": "Fundamentals",
          "slug": "fundamentals",
          "topics": [
            { "name": "Algebra", "slug": "algebra" },
            { "name": "Arithmetic", "slug": "arithmetic" },
            { "name": "Geometry", "slug": "geometry" },
            { "name": "Trigonometry", "slug": "trigonometry" }
          ]
        }
      ]
    },
    {
      "name": "History",
      "slug": "history",
      "subcategories": [
        {
          "name": "Ancient History",
          "slug": "ancient",
          "topics": [
            { "name": "Ancient China", "slug": "ancient-china" },
            { "name": "Ancient Egypt", "slug": "ancient-egypt" },
            { "name": "Ancient Greece", "slug": "ancient-greece" },
            { "name": "Ancient India", "slug": "ancient-india" },
            { "name": "Ancient Persia", "slug": "ancient-persia" },
            { "name": "Mesopotamia", "slug": "mesopotamia" },
            { "name": "Roman Empire", "slug": "roman-empire" }
          ]
        },
        {
          "name": "Medieval History",
          "slug": "medieval",
          "topics": [
            { "name": "Byzantine Empire", "slug": "byzantine-empire" },
            { "name": "Islamic Golden Age", "slug": "islamic-golden-age" },
            { "name": "Medieval Europe", "slug": "medieval-europe" },
            { "name": "Mongol Empire", "slug": "mongol-empire" },
            { "name": "The Crusades", "slug": "crusades" },
            { "name": "Viking Age", "slug": "viking-age" }
          ]
        },
        {
          "name": "Modern History",
          "slug": "modern",
          "topics": [
            { "name": "Age of Exploration", "slug": "age-of-exploration" },
            { "name": "American Revolution", "slug": "american-revolution" },
            { "name": "Civil Rights Movement", "slug": "civil-rights-movement" },
            { "name": "Cold War", "slug": "cold-war" },
            { "name": "French Revolution", "slug": "french-revolution" },
            { "name": "Industrial Revolution", "slug": "industrial-revolution" },
            { "name": "Renaissance", "slug": "renaissance" },
            { "name": "World War I", "slug": "world-war-1" },
            { "name": "World War II", "slug": "world-war-2" }
          ]
        },
        {
          "name": "Regional History",
          "slug": "regional",
          "topics": [
            { "name": "African History", "slug": "african-history" },
            { "name": "American History", "slug": "american-history" },
            { "name": "British History", "slug": "british-history" },
            { "name": "Chinese History", "slug": "chinese-history" },
            { "name": "Indian History", "slug": "indian-history" },
            { "name": "Japanese History", "slug": "japanese-history" }
          ]
        }
      ]
    },
    {
      "name": "Geography",
      "slug": "geography",
      "subcategories": [
        {
          "name": "Landmarks",
          "slug": "landmarks",
          "topics": [
            { "name": "Famous Landmarks", "slug": "famous-landmarks" },
            { "name": "Natural Wonders", "slug": "natural-wonders" },
            { "name": "UNESCO World Heritage Sites", "slug": "unesco-sites" },
            { "name": "World Wonders", "slug": "world-wonders" }
          ]
        },
        {
          "name": "Physical Geography",
          "slug": "physical",
          "topics": [
            { "name": "Climate Zones", "slug": "climate-zones" },
            { "name": "Deserts", "slug": "deserts" },
            { "name": "Islands", "slug": "islands" },
            { "name": "Mountains & Peaks", "slug": "mountains" },
            { "name": "Oceans & Seas", "slug": "oceans-and-seas" },
            { "name": "Rivers & Lakes", "slug": "rivers-and-lakes" }
          ]
        },
        {
          "name": "Political Geography",
          "slug": "political",
          "topics": [
            { "name": "Continents", "slug": "continents" },
            { "name": "Countries & Capitals", "slug": "countries-and-capitals" },
            { "name": "Flags of the World", "slug": "flags-of-the-world" },
            { "name": "World Borders", "slug": "world-borders" }
          ]
        }
      ]
    },
    {
      "name": "Sports",
      "slug": "sports",
      "subcategories": [
        {
          "name": "American Sports",
          "slug": "american-sports",
          "topics": [
            { "name": "MLB (Baseball)", "slug": "mlb" },
            { "name": "NBA (Basketball)", "slug": "nba" },
            { "name": "NFL (American Football)", "slug": "nfl" },
            { "name": "NHL (Hockey)", "slug": "nhl" },
            { "name": "Super Bowl", "slug": "super-bowl" }
          ]
        },
        {
          "name": "Combat Sports",
          "slug": "combat-sports",
          "topics": [
            { "name": "Boxing", "slug": "boxing" },
            { "name": "UFC / MMA", "slug": "ufc-mma" },
            { "name": "WWE (Wrestling)", "slug": "wwe" },
            { "name": "WWE Royal Rumble", "slug": "wwe-royal-rumble" },
            { "name": "WWE WrestleMania", "slug": "wwe-wrestlemania" }
          ]
        },
        {
          "name": "Cricket",
          "slug": "cricket",
          "topics": [
            { "name": "Cricket Legends", "slug": "cricket-legends" },
            { "name": "Cricket World Cups", "slug": "cricket-world-cups" },
            { "name": "Indian Premier League", "slug": "ipl" },
            { "name": "ODI Records", "slug": "odi-cricket" },
            { "name": "T20 Records", "slug": "t20-cricket" },
            { "name": "Test Cricket Records", "slug": "test-cricket" },
            { "name": "The Ashes", "slug": "ashes" }
          ]
        },
        {
          "name": "Football (Soccer)",
          "slug": "football",
          "topics": [
            { "name": "Bundesliga", "slug": "bundesliga" },
            { "name": "FIFA World Cup", "slug": "fifa-world-cup" },
            { "name": "Football Legends", "slug": "football-legends" },
            { "name": "La Liga", "slug": "la-liga" },
            { "name": "Premier League", "slug": "premier-league" },
            { "name": "Serie A", "slug": "serie-a" },
            { "name": "UEFA Champions League", "slug": "champions-league" },
            { "name": "UEFA European Championship", "slug": "euros" }
          ]
        },
        {
          "name": "Motorsport",
          "slug": "motorsport",
          "topics": [
            { "name": "Formula 1", "slug": "formula-1" },
            { "name": "MotoGP", "slug": "motogp" },
            { "name": "NASCAR", "slug": "nascar" },
            { "name": "Rally Racing", "slug": "rally" }
          ]
        },
        {
          "name": "Olympics",
          "slug": "olympics",
          "topics": [
            { "name": "Olympic Legends", "slug": "olympic-legends" },
            { "name": "Olympic Records", "slug": "olympic-records" },
            { "name": "Summer Olympics", "slug": "summer-olympics" },
            { "name": "Winter Olympics", "slug": "winter-olympics" }
          ]
        },
        {
          "name": "Other Sports",
          "slug": "other-sports",
          "topics": [
            { "name": "Athletics (Track & Field)", "slug": "athletics" },
            { "name": "Badminton", "slug": "badminton" },
            { "name": "Cycling", "slug": "cycling" },
            { "name": "Golf", "slug": "golf" },
            { "name": "Swimming", "slug": "swimming" },
            { "name": "Table Tennis", "slug": "table-tennis" }
          ]
        },
        {
          "name": "Tennis",
          "slug": "tennis",
          "topics": [
            { "name": "Grand Slam Tournaments", "slug": "grand-slams" },
            { "name": "Tennis Legends", "slug": "tennis-legends" },
            { "name": "US Open", "slug": "us-open" },
            { "name": "Wimbledon", "slug": "wimbledon" }
          ]
        }
      ]
    },
    {
      "name": "Entertainment",
      "slug": "entertainment",
      "subcategories": [
        {
          "name": "Awards",
          "slug": "awards",
          "topics": [
            { "name": "Academy Awards (Oscars)", "slug": "oscar-awards" },
            { "name": "BAFTA Awards", "slug": "bafta" },
            { "name": "Emmy Awards", "slug": "emmy-awards" },
            { "name": "Golden Globe Awards", "slug": "golden-globes" }
          ]
        },
        {
          "name": "Gaming",
          "slug": "gaming",
          "topics": [
            { "name": "Esports", "slug": "esports" },
            { "name": "Nintendo Games", "slug": "nintendo" },
            { "name": "PC Gaming", "slug": "pc-gaming" },
            { "name": "PlayStation Games", "slug": "playstation" },
            { "name": "Retro Gaming", "slug": "retro-gaming" },
            { "name": "Video Game History", "slug": "video-game-history" }
          ]
        },
        {
          "name": "Literature",
          "slug": "literature",
          "topics": [
            { "name": "Bestselling Books", "slug": "bestsellers" },
            { "name": "Classic Literature", "slug": "classic-literature" },
            { "name": "Famous Authors", "slug": "famous-authors" },
            { "name": "Mythology", "slug": "mythology" },
            { "name": "Nobel Prize in Literature", "slug": "nobel-literature" },
            { "name": "Poetry", "slug": "poetry" },
            { "name": "Shakespeare", "slug": "shakespeare" }
          ]
        },
        {
          "name": "Music",
          "slug": "music",
          "topics": [
            { "name": "Billboard Charts", "slug": "billboard-charts" },
            { "name": "Bollywood Music", "slug": "bollywood-music" },
            { "name": "Classical Music", "slug": "classical-music" },
            { "name": "Grammy Awards", "slug": "grammy-awards" },
            { "name": "Hip Hop & Rap", "slug": "hip-hop" },
            { "name": "Music Legends", "slug": "music-legends" },
            { "name": "Musical Instruments", "slug": "music-instruments" },
            { "name": "Pop Music", "slug": "pop-music" },
            { "name": "Rock Music", "slug": "rock-music" }
          ]
        }
      ]
    },
    {
      "name": "Technology",
      "slug": "technology",
      "subcategories": [
        {
          "name": "Computing",
          "slug": "computing",
          "topics": [
            { "name": "Artificial Intelligence", "slug": "artificial-intelligence" },
            { "name": "Computer History", "slug": "computer-history" },
            { "name": "Cybersecurity", "slug": "cybersecurity" },
            { "name": "Internet History", "slug": "internet-history" },
            { "name": "Operating Systems", "slug": "operating-systems" },
            { "name": "Programming Languages", "slug": "programming-languages" }
          ]
        },
        {
          "name": "Innovations",
          "slug": "innovations",
          "topics": [
            { "name": "Famous Inventions", "slug": "inventions" },
            { "name": "Famous Inventors", "slug": "inventors" },
            { "name": "Smartphones", "slug": "smartphones" },
            { "name": "Social Media", "slug": "social-media" }
          ]
        },
        {
          "name": "Tech Companies",
          "slug": "tech-companies",
          "topics": [
            { "name": "Amazon", "slug": "amazon" },
            { "name": "Apple Inc.", "slug": "apple" },
            { "name": "Google", "slug": "google" },
            { "name": "Microsoft", "slug": "microsoft" },
            { "name": "Tech Founders & CEOs", "slug": "tech-founders" }
          ]
        }
      ]
    },
    {
      "name": "General Knowledge",
      "slug": "general-knowledge",
      "subcategories": [
        {
          "name": "Current Affairs",
          "slug": "current-affairs",
          "topics": [
            { "name": "International Organizations", "slug": "international-organizations" },
            { "name": "Nobel Prizes", "slug": "nobel-prizes" },
            { "name": "World Events", "slug": "world-events" }
          ]
        },
        {
          "name": "India",
          "slug": "india",
          "topics": [
            { "name": "Indian Constitution", "slug": "indian-constitution" },
            { "name": "Indian Culture", "slug": "indian-culture" },
            { "name": "Indian Economy", "slug": "indian-economy" },
            { "name": "Indian Freedom Movement", "slug": "indian-freedom-movement" },
            { "name": "Indian Geography", "slug": "indian-geography" },
            { "name": "Indian Politics", "slug": "indian-politics" }
          ]
        },
        {
          "name": "Indian Epics & Scriptures",
          "slug": "indian-epics",
          "topics": [
            { "name": "Bhagavad Gita", "slug": "bhagavad-gita" },
            { "name": "Jataka Tales", "slug": "jataka-tales" },
            { "name": "Mahabharata", "slug": "mahabharata" },
            { "name": "Panchatantra", "slug": "panchatantra" },
            { "name": "Puranas", "slug": "puranas" },
            { "name": "Ramayana", "slug": "ramayana" },
            { "name": "Upanishads", "slug": "upanishads" },
            { "name": "Vedas", "slug": "vedas" }
          ]
        },
        {
          "name": "Miscellaneous",
          "slug": "miscellaneous",
          "topics": [
            { "name": "Architecture", "slug": "architecture" },
            { "name": "Famous Quotes", "slug": "famous-quotes" },
            { "name": "Fashion", "slug": "fashion" },
            { "name": "Food & Cuisine", "slug": "food-and-cuisine" },
            { "name": "World Currencies", "slug": "currencies" },
            { "name": "World Languages", "slug": "languages" },
            { "name": "World Leaders", "slug": "world-leaders" },
            { "name": "World Religions", "slug": "religions" }
          ]
        }
      ]
    }
  ]
};

// Seed the data
let topicCount = 0;

for (const category of registryData.categories) {
  // Ensure category exists (use existing or create minimal)
  console.log(`\nProcessing: ${category.name}`);

  for (const subcategory of category.subcategories) {
    console.log(`  Subcategory: ${subcategory.name}`);

    // Ensure subcategory exists
    ensureSubcategory({
      category: category.slug,
      slug: subcategory.slug,
      name: subcategory.name,
    });

    for (const topic of subcategory.topics) {
      ensureTopic({
        category: category.slug,
        subcategory: subcategory.slug,
        slug: topic.slug,
        name: topic.name,
        total_parts: (topic as any).totalEpisodes || 0,
        source_type: category.slug === 'tv-shows' ? 'transcript' : undefined,
      });
      topicCount++;
    }
  }
}

console.log(`\n✓ Seeded ${topicCount} topics`);

// Verify
import { getTopics } from '../src/lib/registry';
const allTopics = getTopics();
console.log(`Total topics in registry: ${allTopics.length}`);
