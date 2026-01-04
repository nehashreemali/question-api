/**
 * Wikipedia downloader - fetches articles via Wikipedia API
 *
 * Usage:
 *   bun src/download-wikipedia.ts --category=indian-history-ancient
 *   bun src/download-wikipedia.ts --category=physics
 *   bun src/download-wikipedia.ts --list  (show available categories)
 *
 * Articles are saved to: generation/wikipedia/{category}/{slug}.json
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fetchWithRetry, createRateLimiter, sleep } from './lib/http.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger('wikipedia');
const rateLimiter = createRateLimiter(0.5); // Be nice to Wikipedia - 1 req per 2 seconds

const OUTPUT_DIR = join(process.cwd(), 'generation', 'wikipedia');
const API_BASE = 'https://en.wikipedia.org/w/api.php';

// ============================================================================
// TOPIC DEFINITIONS - Organized by category (from CONTENT_EXPANSION_PLAN.md)
// ============================================================================

const TOPICS: Record<string, { name: string; subcategory: string; articles: string[] }> = {
  // Phase 1a: Indian History - Ancient & Medieval
  'indian-history-ancient': {
    name: 'Indian History - Ancient & Medieval',
    subcategory: 'history/indian',
    articles: [
      // Indus Valley Civilization
      'Harappa',
      'Mohenjo-daro',
      'Indus Valley Civilisation',
      // Maurya Empire
      'Chandragupta Maurya',
      'Bindusara',
      'Ashoka',
      'Maurya Empire',
      'Arthashastra',
      'Chanakya',
      // Gupta Empire
      'Chandragupta I',
      'Samudragupta',
      'Chandragupta II',
      'Gupta Empire',
      'Aryabhata',
      'Kalidasa',
      // South Indian Kingdoms
      'Chola dynasty',
      'Pandya dynasty',
      'Chera dynasty',
      'Pallava dynasty',
      'Vijayanagara Empire',
      'Krishnadevaraya',
      // Delhi Sultanate
      'Qutb ud-Din Aibak',
      'Iltutmish',
      'Razia Sultana',
      'Alauddin Khalji',
      'Muhammad bin Tughlaq',
      'Firuz Shah Tughlaq',
      'Lodi dynasty',
    ],
  },

  // Phase 1b: Indian History - Mughal Empire
  'indian-history-mughal': {
    name: 'Indian History - Mughal Empire',
    subcategory: 'history/indian',
    articles: [
      // Mughal Emperors
      'Babur',
      'Humayun',
      'Akbar',
      'Jahangir',
      'Shah Jahan',
      'Aurangzeb',
      'Bahadur Shah I',
      'Mughal Empire',
      // Key Battles
      'First Battle of Panipat',
      'Second Battle of Panipat',
      'Third Battle of Panipat',
      'Battle of Khanwa',
      'Battle of Haldighati',
      'Battle of Talikota',
      'Battle of Plassey',
      // Mughal Culture
      'Mughal architecture',
      'Taj Mahal',
      'Red Fort',
      'Fatehpur Sikri',
      'Mughal painting',
      'Din-i-Ilahi',
      'Mansabdari system',
      'Mughal gardens',
      // Regional Powers
      'Maratha Empire',
      'Shivaji',
      'Sambhaji',
      'Baji Rao I',
      'Sikh Empire',
      'Guru Nanak',
      'Guru Gobind Singh',
      'Ranjit Singh',
      'Rajput',
      'Maharana Pratap',
    ],
  },

  // Phase 1c: Indian History - British Raj & Independence
  'indian-history-modern': {
    name: 'Indian History - British Raj & Independence',
    subcategory: 'history/indian',
    articles: [
      // East India Company Era
      'East India Company',
      'Battle of Plassey',
      'Battle of Buxar',
      'Robert Clive',
      'Warren Hastings',
      'Doctrine of Lapse',
      'Subsidiary Alliance',
      // 1857 Rebellion
      'Indian Rebellion of 1857',
      'Rani of Jhansi',
      'Mangal Pandey',
      'Tantia Tope',
      'Bahadur Shah Zafar',
      'Nana Sahib',
      // Freedom Movement
      'Indian National Congress',
      'Mahatma Gandhi',
      'Jawaharlal Nehru',
      'Subhas Chandra Bose',
      'Bhagat Singh',
      'Vallabhbhai Patel',
      'B. R. Ambedkar',
      'Lala Lajpat Rai',
      'Bal Gangadhar Tilak',
      // Key Events
      'Salt March',
      'Quit India movement',
      'Non-cooperation movement',
      'Civil disobedience movement',
      'Jallianwala Bagh massacre',
      'Simon Commission',
      'Partition of India',
      // Independence
      'Indian Independence Act 1947',
      'Constitution of India',
      '1951–52 Indian general election',
    ],
  },

  // Phase 1d: Ancient Civilizations - Egypt & Mesopotamia
  'ancient-egypt-mesopotamia': {
    name: 'Ancient Civilizations - Egypt & Mesopotamia',
    subcategory: 'history/ancient',
    articles: [
      // Egyptian Dynasties & Pharaohs
      'Ancient Egypt',
      'Old Kingdom of Egypt',
      'Middle Kingdom of Egypt',
      'New Kingdom of Egypt',
      'Pharaoh',
      'Khufu',
      'Ramesses II',
      'Tutankhamun',
      'Cleopatra',
      'Hatshepsut',
      'Akhenaten',
      'Nefertiti',
      // Egyptian Culture
      'Giza pyramid complex',
      'Great Sphinx of Giza',
      'Valley of the Kings',
      'Egyptian hieroglyphs',
      'Book of the Dead',
      'Mummification',
      'Ancient Egyptian religion',
      // Mesopotamia
      'Mesopotamia',
      'Sumer',
      'Akkadian Empire',
      'Babylon',
      'Hammurabi',
      'Code of Hammurabi',
      'Assyria',
      'Nebuchadnezzar II',
      'Hanging Gardens of Babylon',
      'Cuneiform',
      'Ziggurat',
    ],
  },

  // Phase 1e: Ancient Civilizations - Greece & Rome
  'ancient-greece-rome': {
    name: 'Ancient Civilizations - Greece & Rome',
    subcategory: 'history/ancient',
    articles: [
      // Ancient Greece
      'Ancient Greece',
      'Classical Athens',
      'Sparta',
      'Athenian democracy',
      'Pericles',
      'Ancient Greek philosophy',
      'Socrates',
      'Plato',
      'Aristotle',
      'Pythagoras',
      'Archimedes',
      // Greek Wars & Events
      'Greco-Persian Wars',
      'Battle of Marathon',
      'Battle of Thermopylae',
      'Peloponnesian War',
      'Alexander the Great',
      'Hellenistic period',
      // Roman Republic
      'Ancient Rome',
      'Roman Republic',
      'Roman Senate',
      'Julius Caesar',
      'Pompey',
      'Marcus Junius Brutus',
      'Cicero',
      'Punic Wars',
      'Hannibal',
      // Roman Empire
      'Roman Empire',
      'Augustus',
      'Nero',
      'Trajan',
      'Hadrian',
      'Marcus Aurelius',
      'Constantine the Great',
      'Fall of the Western Roman Empire',
      'Colosseum',
      'Pantheon, Rome',
      'Roman roads',
      'Roman legion',
    ],
  },

  // Phase 1f: Ancient Civilizations - Persia, China, Others
  'ancient-persia-china': {
    name: 'Ancient Civilizations - Persia, China & Others',
    subcategory: 'history/ancient',
    articles: [
      // Persian Empire
      'Achaemenid Empire',
      'Cyrus the Great',
      'Darius I',
      'Xerxes I',
      'Persepolis',
      // Chinese Dynasties
      'History of China',
      'Qin dynasty',
      'Qin Shi Huang',
      'Great Wall of China',
      'Terracotta Army',
      'Han dynasty',
      'Tang dynasty',
      'Ming dynasty',
      'Qing dynasty',
      'Forbidden City',
      'Confucius',
      'Silk Road',
      // Other Ancient Civilizations
      'Phoenicia',
      'Carthage',
      'Maya civilization',
      'Aztec Empire',
      'Inca Empire',
    ],
  },

  // Phase 1g: Medieval History
  'medieval-history': {
    name: 'Medieval History',
    subcategory: 'history/medieval',
    articles: [
      // Byzantine Empire
      'Byzantine Empire',
      'Justinian I',
      'Theodora (wife of Justinian I)',
      'Hagia Sophia',
      'Fall of Constantinople',
      // Islamic Golden Age
      'Islamic Golden Age',
      'Umayyad Caliphate',
      'Abbasid Caliphate',
      'House of Wisdom',
      'Muhammad ibn Musa al-Khwarizmi',
      'Avicenna',
      'Saladin',
      // Mongol Empire
      'Mongol Empire',
      'Genghis Khan',
      'Kublai Khan',
      'Golden Horde',
      'Timur',
      'Mongol conquests',
      // Medieval Europe
      'Middle Ages',
      'Feudalism',
      'Crusades',
      'First Crusade',
      'Knights Templar',
      'Black Death',
      'Hundred Years\' War',
      'Joan of Arc',
      'Holy Roman Empire',
      'Charlemagne',
      'Vikings',
      'Norman Conquest',
      // Ottoman Empire
      'Ottoman Empire',
      'Osman I',
      'Mehmed the Conqueror',
      'Suleiman the Magnificent',
    ],
  },

  // Phase 1h: Renaissance, Exploration & Revolutions
  'renaissance-revolutions': {
    name: 'Renaissance, Exploration & Revolutions',
    subcategory: 'history/modern',
    articles: [
      // Renaissance
      'Renaissance',
      'Italian Renaissance',
      'Florence',
      'House of Medici',
      'Renaissance art',
      'Leonardo da Vinci',
      'Michelangelo',
      'Raphael',
      'Printing press',
      // Age of Exploration
      'Age of Discovery',
      'Christopher Columbus',
      'Vasco da Gama',
      'Ferdinand Magellan',
      'Amerigo Vespucci',
      'Hernán Cortés',
      'Francisco Pizarro',
      'Conquistador',
      // Reformation
      'Reformation',
      'Martin Luther',
      'Ninety-five Theses',
      'John Calvin',
      'Henry VIII of England',
      'Counter-Reformation',
      // Industrial Revolution
      'Industrial Revolution',
      'Steam engine',
      'James Watt',
      'Spinning jenny',
      'Factory system',
      'Child labour',
      'Luddite',
      'Second Industrial Revolution',
      // Revolutions
      'American Revolution',
      'United States Declaration of Independence',
      'George Washington',
      'French Revolution',
      'Storming of the Bastille',
      'Napoleon',
      'Napoleonic Wars',
      'Battle of Waterloo',
    ],
  },

  // Phase 1i: 20th Century - World Wars
  'world-wars': {
    name: '20th Century - World Wars',
    subcategory: 'history/modern',
    articles: [
      // World War I
      'World War I',
      'Causes of World War I',
      'Assassination of Archduke Franz Ferdinand',
      'Triple Alliance (1882)',
      'Triple Entente',
      'Trench warfare',
      'Battle of the Somme',
      'Battle of Verdun',
      'Gallipoli campaign',
      'Treaty of Versailles',
      'League of Nations',
      'Woodrow Wilson',
      // Interwar Period
      'Great Depression',
      'Fascism',
      'Benito Mussolini',
      'Adolf Hitler',
      'Nazi Germany',
      'Weimar Republic',
      'Spanish Civil War',
      // World War II
      'World War II',
      'Causes of World War II',
      'Invasion of Poland',
      'Battle of Britain',
      'Operation Barbarossa',
      'Attack on Pearl Harbor',
      'Normandy landings',
      'Battle of Stalingrad',
      'Battle of Midway',
      'The Holocaust',
      'Auschwitz concentration camp',
      'Anne Frank',
      'Atomic bombings of Hiroshima and Nagasaki',
      'Manhattan Project',
      'Yalta Conference',
      'Potsdam Conference',
      'Nuremberg trials',
      // WWII Leaders
      'Winston Churchill',
      'Franklin D. Roosevelt',
      'Joseph Stalin',
      'Charles de Gaulle',
      'Dwight D. Eisenhower',
    ],
  },

  // Phase 1j: 20th Century - Cold War & Modern
  'cold-war-modern': {
    name: '20th Century - Cold War & Modern',
    subcategory: 'history/modern',
    articles: [
      // Cold War
      'Cold War',
      'Iron Curtain',
      'Berlin Wall',
      'Marshall Plan',
      'NATO',
      'Warsaw Pact',
      'Korean War',
      'Vietnam War',
      'Cuban Missile Crisis',
      'Bay of Pigs Invasion',
      'Space Race',
      'Sputnik 1',
      'Apollo 11',
      'Nuclear arms race',
      'Proxy war',
      'Détente',
      'Glasnost',
      'Perestroika',
      'Fall of the Berlin Wall',
      'Dissolution of the Soviet Union',
      // Cold War Figures
      'John F. Kennedy',
      'Nikita Khrushchev',
      'Leonid Brezhnev',
      'Mikhail Gorbachev',
      'Ronald Reagan',
      'Fidel Castro',
      'Ho Chi Minh',
      'Mao Zedong',
      // Modern Events
      'September 11 attacks',
      'War on terror',
      'Gulf War',
      'European Union',
      'United Nations',
      'Decolonization',
      'Civil rights movement',
      'Martin Luther King Jr.',
      'Nelson Mandela',
      'Apartheid',
    ],
  },

  // Phase 1k: Famous Historical Figures
  'historical-figures': {
    name: 'Famous Historical Figures',
    subcategory: 'history/figures',
    articles: [
      // Scientists - Physics
      'Isaac Newton',
      'Albert Einstein',
      'Galileo Galilei',
      'Nikola Tesla',
      'Michael Faraday',
      'James Clerk Maxwell',
      'Niels Bohr',
      'Werner Heisenberg',
      'Erwin Schrödinger',
      'Max Planck',
      'Richard Feynman',
      'Stephen Hawking',
      'Marie Curie',
      'Enrico Fermi',
      'J. Robert Oppenheimer',
      // Scientists - Other Fields
      'Charles Darwin',
      'Gregor Mendel',
      'Louis Pasteur',
      'Alexander Fleming',
      'James Watson',
      'Francis Crick',
      'Dmitri Mendeleev',
      'Antoine Lavoisier',
      'Carl Linnaeus',
      'Rachel Carson',
      // Inventors
      'Thomas Edison',
      'Alexander Graham Bell',
      'Wright brothers',
      'Guglielmo Marconi',
      'Tim Berners-Lee',
      'Steve Jobs',
      'Bill Gates',
      // Mathematicians
      'Euclid',
      'Pythagoras',
      'Carl Friedrich Gauss',
      'Leonhard Euler',
      'Srinivasa Ramanujan',
      'Alan Turing',
      'Ada Lovelace',
      // Philosophers
      'René Descartes',
      'Immanuel Kant',
      'Friedrich Nietzsche',
      'Karl Marx',
      // Artists & Writers
      'Vincent van Gogh',
      'Pablo Picasso',
      'William Shakespeare',
      'Leo Tolstoy',
      'Fyodor Dostoevsky',
    ],
  },

  // Phase 2a: Physics
  'physics': {
    name: 'Physics',
    subcategory: 'stem/physics',
    articles: [
      // Classical Mechanics
      'Newton\'s laws of motion',
      'Force',
      'Mass',
      'Acceleration',
      'Velocity',
      'Speed',
      'Energy',
      'Kinetic energy',
      'Potential energy',
      'Momentum',
      'Gravity',
      'Work (physics)',
      'Power (physics)',
      'Friction',
      'Circular motion',
      'Simple harmonic motion',
      'Projectile motion',
      // Thermodynamics
      'Thermodynamics',
      'Laws of thermodynamics',
      'Heat',
      'Temperature',
      'Entropy',
      'Heat transfer',
      'Thermal conduction',
      'Convection',
      'Thermal radiation',
      'Specific heat capacity',
      'Ideal gas law',
      // Electromagnetism
      'Electric charge',
      'Electric current',
      'Voltage',
      'Electrical resistance and conductance',
      'Ohm\'s law',
      'Electric field',
      'Magnetic field',
      'Electromagnet',
      'Electromagnetic induction',
      'Faraday\'s law of induction',
      'Maxwell\'s equations',
      'Electrical network',
      'Capacitor',
      'Inductor',
      // Waves & Optics
      'Wave',
      'Wavelength',
      'Frequency',
      'Amplitude',
      'Sound',
      'Speed of sound',
      'Doppler effect',
      'Light',
      'Speed of light',
      'Reflection (physics)',
      'Refraction',
      'Snell\'s law',
      'Diffraction',
      'Wave interference',
      'Polarization (waves)',
      'Lens',
      'Mirror',
      // Modern Physics
      'Special relativity',
      'General relativity',
      'Mass–energy equivalence',
      'Time dilation',
      'Quantum mechanics',
      'Wave–particle duality',
      'Photoelectric effect',
      'Uncertainty principle',
      'Schrödinger equation',
      'Atomic theory',
      'Bohr model',
      'Electron',
      'Proton',
      'Neutron',
      'Quark',
      // Nuclear Physics
      'Radioactive decay',
      'Alpha particle',
      'Beta particle',
      'Gamma ray',
      'Half-life',
      'Nuclear fission',
      'Nuclear fusion',
      'Nuclear reactor',
      'Nuclear weapon',
      'Nuclear chain reaction',
    ],
  },

  // Phase 2b: Chemistry
  'chemistry': {
    name: 'Chemistry',
    subcategory: 'stem/chemistry',
    articles: [
      // Atomic Structure
      'Atom',
      'Electron',
      'Proton',
      'Neutron',
      'Atomic number',
      'Mass number',
      'Isotope',
      'Ion',
      'Electron configuration',
      'Atomic orbital',
      'Valence electron',
      // Periodic Table
      'Periodic table',
      'Chemical element',
      'Metal',
      'Nonmetal',
      'Metalloid',
      'Alkali metal',
      'Alkaline earth metal',
      'Halogen',
      'Noble gas',
      'Transition metal',
      'Lanthanide',
      'Actinide',
      'Hydrogen',
      'Oxygen',
      'Carbon',
      'Nitrogen',
      'Iron',
      'Gold',
      'Silver',
      // Chemical Bonding
      'Chemical bond',
      'Covalent bond',
      'Ionic bonding',
      'Metallic bonding',
      'Hydrogen bond',
      'Van der Waals force',
      'Molecule',
      'Chemical compound',
      'Lewis structure',
      'VSEPR theory',
      // States of Matter
      'State of matter',
      'Solid',
      'Liquid',
      'Gas',
      'Plasma (physics)',
      'Phase transition',
      'Melting point',
      'Boiling point',
      'Sublimation (phase transition)',
      'Condensation',
      // Chemical Reactions
      'Chemical reaction',
      'Chemical equation',
      'Reagent',
      'Product (chemistry)',
      'Catalysis',
      'Oxidation',
      'Reduction (chemistry)',
      'Redox',
      'Combustion',
      'Chemical synthesis',
      'Decomposition',
      'Acid–base reaction',
      'Precipitation (chemistry)',
      'Exothermic reaction',
      'Endothermic process',
      'Activation energy',
      'Reaction rate',
      'Chemical equilibrium',
      'Le Chatelier\'s principle',
      // Acids & Bases
      'Acid',
      'Base (chemistry)',
      'PH',
      'Neutralization (chemistry)',
      'Buffer solution',
      'Hydrochloric acid',
      'Sulfuric acid',
      'Sodium hydroxide',
      // Organic Chemistry
      'Organic chemistry',
      'Organic compound',
      'Hydrocarbon',
      'Alkane',
      'Alkene',
      'Alkyne',
      'Aromaticity',
      'Benzene',
      'Functional group',
      'Alcohol',
      'Aldehyde',
      'Ketone',
      'Carboxylic acid',
      'Ester',
      'Amine',
      'Polymer',
      'Isomer',
    ],
  },

  // Phase 2c: Biology
  'biology': {
    name: 'Biology',
    subcategory: 'stem/biology',
    articles: [
      // Cell Biology
      'Cell (biology)',
      'Cell theory',
      'Prokaryote',
      'Eukaryote',
      'Cell membrane',
      'Cell wall',
      'Cytoplasm',
      'Cell nucleus',
      'Nucleolus',
      'Ribosome',
      'Endoplasmic reticulum',
      'Golgi apparatus',
      'Mitochondrion',
      'Chloroplast',
      'Vacuole',
      'Lysosome',
      'Cytoskeleton',
      // Cell Division
      'Cell division',
      'Cell cycle',
      'Mitosis',
      'Meiosis',
      'Chromosome',
      'Chromatid',
      'Centromere',
      'Interphase',
      // Genetics
      'Genetics',
      'Gene',
      'Allele',
      'Genotype',
      'Phenotype',
      'Dominance (genetics)',
      'Heredity',
      'Mendelian inheritance',
      'Punnett square',
      'DNA',
      'RNA',
      'DNA replication',
      'Transcription (biology)',
      'Translation (biology)',
      'Genetic code',
      'Mutation',
      'Genetic engineering',
      'CRISPR',
      'Cloning',
      'Human Genome Project',
      // Evolution
      'Evolution',
      'Natural selection',
      'On the Origin of Species',
      'Adaptation',
      'Speciation',
      'Fossil',
      'Homology (biology)',
      'Vestigiality',
      'Common descent',
      'Phylogenetics',
      'Extinction',
      // Human Body Systems
      'Human body',
      'Circulatory system',
      'Heart',
      'Blood',
      'Blood vessel',
      'Respiratory system',
      'Lung',
      'Breathing',
      'Digestive system',
      'Stomach',
      'Intestine',
      'Liver',
      'Nervous system',
      'Human brain',
      'Neuron',
      'Spinal cord',
      'Skeletal system',
      'Bone',
      'Muscular system',
      'Muscle',
      'Immune system',
      'Antibody',
      'White blood cell',
      'Endocrine system',
      'Hormone',
      // Ecology
      'Ecology',
      'Ecosystem',
      'Biome',
      'Food chain',
      'Food web',
      'Primary producers',
      'Consumer (food chain)',
      'Decomposer',
      'Photosynthesis',
      'Cellular respiration',
      'Carbon cycle',
      'Nitrogen cycle',
      'Water cycle',
      'Biodiversity',
      'Endangered species',
      'Conservation biology',
    ],
  },

  // Phase 2d: Space & Astronomy
  'space': {
    name: 'Space & Astronomy',
    subcategory: 'stem/space',
    articles: [
      // Solar System
      'Solar System',
      'Sun',
      'Mercury (planet)',
      'Venus',
      'Earth',
      'Mars',
      'Jupiter',
      'Saturn',
      'Uranus',
      'Neptune',
      'Pluto',
      'Moon',
      'Lunar eclipse',
      'Solar eclipse',
      'Asteroid',
      'Asteroid belt',
      'Comet',
      'Meteor',
      'Meteorite',
      // Stars & Stellar Evolution
      'Star',
      'Stellar evolution',
      'Nebula',
      'Protostar',
      'Main sequence',
      'Red giant',
      'White dwarf',
      'Supernova',
      'Neutron star',
      'Pulsar',
      'Black hole',
      'Binary star',
      'Constellation',
      'Polaris',
      // Galaxies & Universe
      'Galaxy',
      'Milky Way',
      'Andromeda Galaxy',
      'Spiral galaxy',
      'Elliptical galaxy',
      'Quasar',
      'Universe',
      'Big Bang',
      'Cosmic microwave background',
      'Dark matter',
      'Dark energy',
      'Expansion of the universe',
      'Hubble\'s law',
      // Space Exploration
      'Space exploration',
      'NASA',
      'Indian Space Research Organisation',
      'European Space Agency',
      'SpaceX',
      'Roscosmos',
      'Rocket',
      'Satellite',
      'Space station',
      'International Space Station',
      'Apollo program',
      'Moon landing',
      'Neil Armstrong',
      'Buzz Aldrin',
      'Mars rover',
      'Curiosity (rover)',
      'Perseverance (rover)',
      'Voyager program',
      'Hubble Space Telescope',
      'James Webb Space Telescope',
      'Space Shuttle',
      'Yuri Gagarin',
    ],
  },

  // Phase 2e: Mathematics Concepts
  'mathematics': {
    name: 'Mathematics',
    subcategory: 'stem/mathematics',
    articles: [
      // Basic Math
      'Number',
      'Integer',
      'Fraction',
      'Decimal',
      'Percentage',
      'Ratio',
      'Proportionality (mathematics)',
      'Prime number',
      'Composite number',
      'Divisor',
      'Multiple (mathematics)',
      'Greatest common divisor',
      'Least common multiple',
      // Algebra
      'Algebra',
      'Variable (mathematics)',
      'Equation',
      'Linear equation',
      'Quadratic equation',
      'Polynomial',
      'Function (mathematics)',
      'Graph of a function',
      'Slope',
      'Y-intercept',
      'System of linear equations',
      'Inequality (mathematics)',
      'Exponentiation',
      'Logarithm',
      'Square root',
      // Geometry
      'Geometry',
      'Point (geometry)',
      'Line (geometry)',
      'Plane (geometry)',
      'Angle',
      'Triangle',
      'Pythagorean theorem',
      'Quadrilateral',
      'Rectangle',
      'Square',
      'Circle',
      'Area',
      'Perimeter',
      'Volume',
      'Surface area',
      'Congruence (geometry)',
      'Similarity (geometry)',
      'Parallel (geometry)',
      'Perpendicular',
      'Analytic geometry',
      // Trigonometry
      'Trigonometry',
      'Sine',
      'Cosine',
      'Tangent',
      'Unit circle',
      'List of trigonometric identities',
      'Law of sines',
      'Law of cosines',
      // Calculus
      'Calculus',
      'Limit (mathematics)',
      'Derivative',
      'Differential calculus',
      'Integral',
      'Integral calculus',
      'Fundamental theorem of calculus',
      'Chain rule',
      'Product rule',
      // Statistics & Probability
      'Statistics',
      'Mean',
      'Median',
      'Mode (statistics)',
      'Standard deviation',
      'Variance',
      'Probability',
      'Permutation',
      'Combination',
      'Normal distribution',
      'Binomial distribution',
      // Famous Theorems
      "Fermat's Last Theorem",
      "Goldbach's conjecture",
      'Riemann hypothesis',
    ],
  },

  // Phase 3a: Countries & Capitals
  'geography-countries': {
    name: 'Countries & Capitals',
    subcategory: 'geography/countries',
    articles: [
      // Major World Countries
      'United States',
      'Canada',
      'Mexico',
      'Brazil',
      'Argentina',
      'United Kingdom',
      'France',
      'Germany',
      'Italy',
      'Spain',
      'Russia',
      'China',
      'Japan',
      'South Korea',
      'India',
      'Australia',
      'South Africa',
      'Egypt',
      'Saudi Arabia',
      'Turkey',
      'Indonesia',
      'Nigeria',
      // Continents
      'Asia',
      'Europe',
      'Africa',
      'North America',
      'South America',
      'Australia (continent)',
      'Oceania',
      'Antarctica',
      // World Capitals
      'Washington, D.C.',
      'London',
      'Paris',
      'Berlin',
      'Tokyo',
      'Beijing',
      'New Delhi',
      'Moscow',
      'Canberra',
    ],
  },

  // Phase 3b: Physical Geography
  'geography-physical': {
    name: 'Physical Geography',
    subcategory: 'geography/physical',
    articles: [
      // Mountains
      'Himalayas',
      'Mount Everest',
      'K2',
      'Alps',
      'Andes',
      'Rocky Mountains',
      'Mount Kilimanjaro',
      'Denali',
      'Mont Blanc',
      'Matterhorn',
      // Rivers
      'Ganges',
      'Nile',
      'Amazon River',
      'Mississippi River',
      'Yangtze',
      'Danube',
      'Brahmaputra River',
      'Indus River',
      'River Thames',
      'Seine',
      // Deserts
      'Sahara',
      'Thar Desert',
      'Gobi Desert',
      'Arabian Desert',
      'Kalahari Desert',
      'Atacama Desert',
      'Mojave Desert',
      // Oceans & Seas
      'Pacific Ocean',
      'Atlantic Ocean',
      'Indian Ocean',
      'Arctic Ocean',
      'Southern Ocean',
      'Mediterranean Sea',
      'Caribbean Sea',
      'Red Sea',
      'Arabian Sea',
      'Bay of Bengal',
      // Other Features
      'Great Barrier Reef',
      'Amazon rainforest',
      'Great Lakes',
      'Lake Baikal',
      'Mariana Trench',
      'Ring of Fire',
      'Plate tectonics',
    ],
  },

  // Phase 3c: World Landmarks
  'geography-landmarks': {
    name: 'World Landmarks & Wonders',
    subcategory: 'geography/landmarks',
    articles: [
      // Man-made Wonders
      'Seven Wonders of the Ancient World',
      'New7Wonders of the World',
      'Taj Mahal',
      'Great Wall of China',
      'Eiffel Tower',
      'Colosseum',
      'Machu Picchu',
      'Petra',
      'Christ the Redeemer (statue)',
      'Great Pyramid of Giza',
      'Statue of Liberty',
      'Big Ben',
      'Sydney Opera House',
      'Burj Khalifa',
      'Angkor Wat',
      // Natural Wonders
      'Grand Canyon',
      'Victoria Falls',
      'Aurora',
      'Niagara Falls',
      'Iguazu Falls',
      'Ha Long Bay',
      'Yellowstone National Park',
    ],
  },

  // Phase 4a: Cricket
  'cricket': {
    name: 'Cricket',
    subcategory: 'sports/cricket',
    articles: [
      // World Cups
      'Cricket World Cup',
      'ICC T20 World Cup',
      '1983 Cricket World Cup',
      '2011 Cricket World Cup',
      '2023 Cricket World Cup',
      // Legends
      'Sachin Tendulkar',
      'Virat Kohli',
      'MS Dhoni',
      'Kapil Dev',
      'Sunil Gavaskar',
      'Don Bradman',
      'Shane Warne',
      'Brian Lara',
      'Ricky Ponting',
      // IPL
      'Indian Premier League',
    ],
  },

  // Phase 4b: Football & Olympics
  'sports-misc': {
    name: 'Football & Olympics',
    subcategory: 'sports',
    articles: [
      // Football/Soccer
      'FIFA World Cup',
      'Lionel Messi',
      'Cristiano Ronaldo',
      'Pelé',
      'Diego Maradona',
      'UEFA Champions League',
      // Olympics
      'Olympic Games',
      'Summer Olympic Games',
      'Winter Olympic Games',
      'Usain Bolt',
      'Michael Phelps',
    ],
  },

  // Phase 5a: Art History
  'art-history': {
    name: 'Art History',
    subcategory: 'arts/art-history',
    articles: [
      // Art Movements
      'Renaissance art',
      'Baroque',
      'Romanticism',
      'Impressionism',
      'Post-Impressionism',
      'Cubism',
      'Surrealism',
      'Abstract art',
      'Pop art',
      // Famous Artists (some overlap with historical figures)
      'Rembrandt',
      'Claude Monet',
      'Salvador Dalí',
      'Frida Kahlo',
      'Andy Warhol',
      // Famous Artworks
      'Mona Lisa',
      'The Last Supper (Leonardo)',
      'Sistine Chapel ceiling',
      'The Starry Night',
      'Girl with a Pearl Earring',
      'The Scream',
      'Guernica',
    ],
  },

  // Phase 5b: Music History
  'music-history': {
    name: 'Music History',
    subcategory: 'arts/music',
    articles: [
      // Classical Music
      'Classical music',
      'Wolfgang Amadeus Mozart',
      'Ludwig van Beethoven',
      'Johann Sebastian Bach',
      'Frédéric Chopin',
      'Pyotr Ilyich Tchaikovsky',
      'Symphony',
      'Concerto',
      'Opera',
      // Modern Music
      'Rock music',
      'The Beatles',
      'Elvis Presley',
      'Michael Jackson',
      'Queen (band)',
      'Led Zeppelin',
      'Pink Floyd',
      'Pop music',
      'Hip hop music',
      'Jazz',
      'Blues',
    ],
  },

  // Phase 5c: Inventions
  'inventions': {
    name: 'Inventions & Discoveries',
    subcategory: 'arts/inventions',
    articles: [
      // Ancient Inventions
      'Wheel',
      'History of writing',
      'Paper',
      'Compass',
      'Gunpowder',
      'Printing press',
      // Industrial Era
      'Steam engine',
      'Locomotive',
      'Telegraphy',
      'Telephone',
      'Incandescent light bulb',
      'Automobile',
      'Airplane',
      // Modern Inventions
      'Radio',
      'Television',
      'Computer',
      'Internet',
      'World Wide Web',
      'Smartphone',
      'GPS',
      'Vaccine',
      'Antibiotic',
      'Penicillin',
      'X-ray',
    ],
  },

  // ============================================================================
  // PHASE 6: NEW CATEGORIES
  // ============================================================================

  // Computer Science
  'computer-science': {
    name: 'Computer Science',
    subcategory: 'stem/computer-science',
    articles: [
      // Fundamentals
      'Computer science',
      'Algorithm',
      'Data structure',
      'Programming language',
      'Software engineering',
      'Computer programming',
      'Source code',
      'Compiler',
      'Debugging',
      // Data Structures
      'Array (data structure)',
      'Linked list',
      'Stack (abstract data type)',
      'Queue (abstract data type)',
      'Hash table',
      'Binary tree',
      'Graph (abstract data type)',
      'Heap (data structure)',
      // Algorithms
      'Sorting algorithm',
      'Search algorithm',
      'Binary search algorithm',
      'Recursion (computer science)',
      'Dynamic programming',
      'Big O notation',
      'Dijkstra\'s algorithm',
      // Programming Languages
      'Python (programming language)',
      'JavaScript',
      'Java (programming language)',
      'C (programming language)',
      'C++',
      'Rust (programming language)',
      'Go (programming language)',
      'SQL',
      'HTML',
      'CSS',
      // AI & ML
      'Artificial intelligence',
      'Machine learning',
      'Deep learning',
      'Neural network',
      'Natural language processing',
      'Computer vision',
      'Reinforcement learning',
      'ChatGPT',
      'Large language model',
      // Other CS Topics
      'Operating system',
      'Database',
      'Computer network',
      'Cybersecurity',
      'Cryptography',
      'Cloud computing',
      'Distributed computing',
      'Version control',
      'Git',
      'Open-source software',
    ],
  },

  // Medicine & Health
  'medicine': {
    name: 'Medicine & Health',
    subcategory: 'stem/medicine',
    articles: [
      // Medical Fields
      'Medicine',
      'Surgery',
      'Cardiology',
      'Neurology',
      'Oncology',
      'Pediatrics',
      'Psychiatry',
      'Radiology',
      'Dermatology',
      'Ophthalmology',
      // Common Diseases
      'Cancer',
      'Diabetes',
      'Heart disease',
      'Stroke',
      'Alzheimer\'s disease',
      'Parkinson\'s disease',
      'Influenza',
      'Tuberculosis',
      'Malaria',
      'HIV/AIDS',
      'COVID-19',
      'Pneumonia',
      'Asthma',
      'Arthritis',
      'Depression (mood)',
      // Medical Discoveries
      'History of medicine',
      'Vaccination',
      'Anesthesia',
      'Blood transfusion',
      'Organ transplantation',
      'In vitro fertilisation',
      'Insulin',
      'Aspirin',
      // Anatomy (additions)
      'Kidney',
      'Pancreas',
      'Thyroid',
      'Skin',
      'Eye',
      'Ear',
      // Public Health
      'Public health',
      'Epidemiology',
      'World Health Organization',
      'Pandemic',
      'Epidemic',
    ],
  },

  // Animals & Nature
  'animals': {
    name: 'Animals & Nature',
    subcategory: 'nature/animals',
    articles: [
      // Mammals
      'Lion',
      'Tiger',
      'Elephant',
      'Giraffe',
      'Hippopotamus',
      'Rhinoceros',
      'Zebra',
      'Gorilla',
      'Chimpanzee',
      'Orangutan',
      'Polar bear',
      'Grizzly bear',
      'Wolf',
      'Fox',
      'Whale',
      'Dolphin',
      'Shark',
      'Kangaroo',
      'Koala',
      'Panda',
      // Birds
      'Eagle',
      'Owl',
      'Penguin',
      'Parrot',
      'Peacock',
      'Flamingo',
      'Hummingbird',
      // Reptiles & Amphibians
      'Crocodile',
      'Alligator',
      'Snake',
      'Turtle',
      'Lizard',
      'Frog',
      // Insects
      'Butterfly',
      'Bee',
      'Ant',
      'Spider',
      // Dinosaurs
      'Dinosaur',
      'Tyrannosaurus',
      'Triceratops',
      'Velociraptor',
      'Brachiosaurus',
      'Stegosaurus',
      'Pterosaur',
      // Marine Life
      'Octopus',
      'Jellyfish',
      'Coral reef',
      'Sea turtle',
    ],
  },

  // Plants & Environment
  'plants': {
    name: 'Plants & Environment',
    subcategory: 'nature/plants',
    articles: [
      'Plant',
      'Tree',
      'Flower',
      'Forest',
      'Rainforest',
      'Deforestation',
      'Climate change',
      'Global warming',
      'Greenhouse effect',
      'Renewable energy',
      'Solar power',
      'Wind power',
      'Hydropower',
      'Nuclear power',
      'Pollution',
      'Recycling',
      'Sustainability',
      'National park',
      'Wildlife conservation',
    ],
  },

  // World Religions
  'religions': {
    name: 'World Religions',
    subcategory: 'culture/religions',
    articles: [
      // Major Religions
      'Religion',
      'Christianity',
      'Islam',
      'Hinduism',
      'Buddhism',
      'Judaism',
      'Sikhism',
      'Jainism',
      'Shinto',
      'Taoism',
      'Zoroastrianism',
      // Religious Figures
      'Jesus',
      'Muhammad',
      'Gautama Buddha',
      'Krishna',
      'Moses',
      'Abraham',
      // Religious Texts
      'Bible',
      'Quran',
      'Vedas',
      'Upanishads',
      'Torah',
      'Talmud',
      'Tripitaka',
      // Religious Concepts
      'Prayer',
      'Meditation',
      'Karma',
      'Nirvana',
      'Salvation',
      'Pilgrimage',
      'Mosque',
      'Church (building)',
      'Temple',
      'Synagogue',
    ],
  },

  // Literature
  'literature': {
    name: 'Literature',
    subcategory: 'arts/literature',
    articles: [
      // Authors
      'Charles Dickens',
      'Jane Austen',
      'Mark Twain',
      'Ernest Hemingway',
      'F. Scott Fitzgerald',
      'Virginia Woolf',
      'George Orwell',
      'Franz Kafka',
      'Gabriel García Márquez',
      'Haruki Murakami',
      'Toni Morrison',
      'Maya Angelou',
      'Edgar Allan Poe',
      'Oscar Wilde',
      'Homer',
      'Dante Alighieri',
      'Miguel de Cervantes',
      'Victor Hugo',
      'Alexandre Dumas',
      // Classic Novels
      'Pride and Prejudice',
      'Moby-Dick',
      'War and Peace',
      'Crime and Punishment',
      'The Great Gatsby',
      '1984 (novel)',
      'To Kill a Mockingbird',
      'One Hundred Years of Solitude',
      'Don Quixote',
      'The Odyssey',
      'Divine Comedy',
      'Les Misérables',
      'Anna Karenina',
      'The Brothers Karamazov',
      'Wuthering Heights',
      'Jane Eyre',
      'Great Expectations',
      'The Catcher in the Rye',
      'Lord of the Flies',
      'Brave New World',
      // Literary Movements
      'Literary modernism',
      'Romanticism in literature',
      'Realism (arts)',
      'Magical realism',
      // Poetry
      'Poetry',
      'William Wordsworth',
      'John Keats',
      'Percy Bysshe Shelley',
      'Emily Dickinson',
      'Robert Frost',
      'Walt Whitman',
      'T. S. Eliot',
    ],
  },

  // Film & Cinema
  'film': {
    name: 'Film & Cinema',
    subcategory: 'arts/film',
    articles: [
      // Directors
      'Steven Spielberg',
      'Martin Scorsese',
      'Alfred Hitchcock',
      'Stanley Kubrick',
      'Quentin Tarantino',
      'Christopher Nolan',
      'Francis Ford Coppola',
      'Ridley Scott',
      'James Cameron',
      'Akira Kurosawa',
      'Hayao Miyazaki',
      'Wes Anderson',
      'Denis Villeneuve',
      // Classic Films
      'Citizen Kane',
      'The Godfather',
      'Casablanca (film)',
      'Schindler\'s List',
      'The Shawshank Redemption',
      '2001: A Space Odyssey (film)',
      'Psycho (1960 film)',
      'Pulp Fiction',
      'The Dark Knight',
      'Forrest Gump',
      'Fight Club',
      'The Matrix',
      'Inception',
      'Titanic (1997 film)',
      'Avatar (2009 film)',
      'Jurassic Park (film)',
      'E.T. the Extra-Terrestrial',
      'Star Wars (film)',
      // Film History
      'History of film',
      'Silent film',
      'Hollywood',
      'Bollywood',
      'Academy Awards',
      'Cannes Film Festival',
      'Film noir',
      'Animation',
      'Documentary film',
      // Studios
      'Walt Disney Studios',
      'Warner Bros.',
      'Universal Pictures',
      'Pixar',
      'Studio Ghibli',
    ],
  },

  // More Sports
  'basketball': {
    name: 'Basketball',
    subcategory: 'sports/basketball',
    articles: [
      'Basketball',
      'NBA',
      'Michael Jordan',
      'LeBron James',
      'Kobe Bryant',
      'Shaquille O\'Neal',
      'Magic Johnson',
      'Larry Bird',
      'Stephen Curry',
      'Kevin Durant',
      'Tim Duncan',
      'Kareem Abdul-Jabbar',
      'Wilt Chamberlain',
      'Bill Russell',
      'Chicago Bulls',
      'Los Angeles Lakers',
      'Boston Celtics',
      'Golden State Warriors',
      'WNBA',
      'NCAA Division I Men\'s Basketball Tournament',
    ],
  },

  'tennis': {
    name: 'Tennis',
    subcategory: 'sports/tennis',
    articles: [
      'Tennis',
      'Grand Slam (tennis)',
      'Wimbledon Championships',
      'US Open (tennis)',
      'French Open',
      'Australian Open',
      'Roger Federer',
      'Rafael Nadal',
      'Novak Djokovic',
      'Serena Williams',
      'Venus Williams',
      'Pete Sampras',
      'Andre Agassi',
      'Steffi Graf',
      'Martina Navratilova',
      'Billie Jean King',
      'ATP Tour',
      'WTA Tour',
    ],
  },

  'formula1': {
    name: 'Formula 1',
    subcategory: 'sports/motorsport',
    articles: [
      'Formula One',
      'FIA',
      'List of Formula One World Drivers\' Champions',
      'Michael Schumacher',
      'Lewis Hamilton',
      'Ayrton Senna',
      'Sebastian Vettel',
      'Max Verstappen',
      'Alain Prost',
      'Niki Lauda',
      'Fernando Alonso',
      'Kimi Räikkönen',
      'Ferrari',
      'McLaren',
      'Red Bull Racing',
      'Mercedes-Benz in Formula One',
      'Monaco Grand Prix',
      'British Grand Prix',
      'Italian Grand Prix',
    ],
  },

  // Food & Cuisine
  'food': {
    name: 'Food & Cuisine',
    subcategory: 'culture/food',
    articles: [
      // World Cuisines
      'Italian cuisine',
      'French cuisine',
      'Chinese cuisine',
      'Japanese cuisine',
      'Indian cuisine',
      'Mexican cuisine',
      'Thai cuisine',
      'Mediterranean cuisine',
      'American cuisine',
      'Korean cuisine',
      // Famous Dishes
      'Pizza',
      'Pasta',
      'Sushi',
      'Curry',
      'Hamburger',
      'Taco',
      'Dim sum',
      'Ramen',
      'Croissant',
      'Biryani',
      // Ingredients & Basics
      'Rice',
      'Wheat',
      'Bread',
      'Cheese',
      'Wine',
      'Beer',
      'Coffee',
      'Tea',
      'Chocolate',
      'Olive oil',
      'Spice',
      'Sugar',
      'Salt',
      // Cooking
      'Cooking',
      'Chef',
      'Restaurant',
      'Michelin Guide',
      'Vegetarianism',
      'Veganism',
    ],
  },

  // Technology Companies
  'technology': {
    name: 'Technology Companies',
    subcategory: 'technology/companies',
    articles: [
      // Companies
      'Apple Inc.',
      'Google',
      'Microsoft',
      'Amazon (company)',
      'Meta Platforms',
      'Tesla, Inc.',
      'Netflix',
      'Intel',
      'IBM',
      'Samsung Electronics',
      'Sony',
      'Nvidia',
      'OpenAI',
      'Twitter',
      'TikTok',
      'Uber',
      'Airbnb',
      'Spotify',
      // Products & Services
      'iPhone',
      'Android (operating system)',
      'Windows',
      'macOS',
      'Linux',
      'Google Search',
      'YouTube',
      'Facebook',
      'Instagram',
      'WhatsApp',
      'Amazon Web Services',
      'Cryptocurrency',
      'Bitcoin',
      'Blockchain',
      // Tech History
      'History of the Internet',
      'Dot-com bubble',
      'Silicon Valley',
      'Personal computer',
      'Smartphone',
      'Tablet computer',
    ],
  },

  // Architecture
  'architecture': {
    name: 'Architecture',
    subcategory: 'arts/architecture',
    articles: [
      // Architectural Styles
      'Architecture',
      'Gothic architecture',
      'Romanesque architecture',
      'Baroque architecture',
      'Art Deco',
      'Art Nouveau',
      'Modernist architecture',
      'Postmodern architecture',
      'Neoclassical architecture',
      'Byzantine architecture',
      'Islamic architecture',
      // Famous Architects
      'Frank Lloyd Wright',
      'Le Corbusier',
      'Frank Gehry',
      'Zaha Hadid',
      'I. M. Pei',
      'Antoni Gaudí',
      'Ludwig Mies van der Rohe',
      'Renzo Piano',
      'Norman Foster',
      // Famous Buildings (additions)
      'Empire State Building',
      'Chrysler Building',
      'One World Trade Center',
      'Sagrada Família',
      'Louvre',
      'Vatican City',
      'Buckingham Palace',
      'Palace of Versailles',
      'Neuschwanstein Castle',
      'Kremlin',
      'Notre-Dame de Paris',
      'Westminster Abbey',
      'St. Peter\'s Basilica',
      'Blue Mosque',
      'Golden Gate Bridge',
      'Tower Bridge',
      'Brooklyn Bridge',
    ],
  },

  // Philosophy
  'philosophy': {
    name: 'Philosophy',
    subcategory: 'culture/philosophy',
    articles: [
      'Philosophy',
      'Ethics',
      'Metaphysics',
      'Epistemology',
      'Logic',
      'Aesthetics',
      'Political philosophy',
      'Philosophy of mind',
      'Existentialism',
      'Stoicism',
      'Utilitarianism',
      'Empiricism',
      'Rationalism',
      'Pragmatism',
      // Philosophers (additions to historical figures)
      'John Locke',
      'David Hume',
      'Jean-Jacques Rousseau',
      'Voltaire',
      'Baruch Spinoza',
      'Thomas Hobbes',
      'John Stuart Mill',
      'Bertrand Russell',
      'Ludwig Wittgenstein',
      'Jean-Paul Sartre',
      'Simone de Beauvoir',
      'Hannah Arendt',
      'Michel Foucault',
      'Noam Chomsky',
    ],
  },

  // Economics
  'economics': {
    name: 'Economics',
    subcategory: 'social/economics',
    articles: [
      'Economics',
      'Macroeconomics',
      'Microeconomics',
      'Capitalism',
      'Socialism',
      'Communism',
      'Free market',
      'Supply and demand',
      'Inflation',
      'Recession',
      'Gross domestic product',
      'Stock market',
      'Wall Street',
      'Federal Reserve',
      'Central bank',
      'International Monetary Fund',
      'World Bank',
      'Trade',
      'Globalization',
      // Economists
      'Adam Smith',
      'John Maynard Keynes',
      'Milton Friedman',
      'Paul Krugman',
      'Thomas Piketty',
      // Economic Events
      'Great Depression',
      'Financial crisis of 2007–2008',
      'Dot-com bubble',
    ],
  },

  // Psychology
  'psychology': {
    name: 'Psychology',
    subcategory: 'social/psychology',
    articles: [
      'Psychology',
      'Cognitive psychology',
      'Social psychology',
      'Developmental psychology',
      'Clinical psychology',
      'Behaviorism',
      'Psychoanalysis',
      // Key Figures
      'Sigmund Freud',
      'Carl Jung',
      'B. F. Skinner',
      'Ivan Pavlov',
      'Abraham Maslow',
      'Jean Piaget',
      'Carl Rogers',
      // Concepts
      'Consciousness',
      'Memory',
      'Learning',
      'Emotion',
      'Motivation',
      'Personality psychology',
      'Intelligence quotient',
      'Cognitive bias',
      'Classical conditioning',
      'Operant conditioning',
      'Maslow\'s hierarchy of needs',
    ],
  },
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

interface WikiArticle {
  title: string;
  slug: string;
  extract: string;
  categories: string[];
  sections: string[];
  source: string;
  sourceUrl: string;
  scrapedAt: string;
  wordCount: number;
}

/**
 * Slugify a title for filename
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Fetch article content from Wikipedia API
 */
async function fetchArticle(title: string): Promise<WikiArticle | null> {
  try {
    // Use the TextExtracts API for clean plaintext
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: title,
      prop: 'extracts|categories',
      explaintext: 'true',
      exsectionformat: 'plain',
      cllimit: '20',
    });

    const url = `${API_BASE}?${params.toString()}`;
    const response = await fetchWithRetry(url);
    // axios already parses JSON, but if it's a string, parse it
    const data = typeof response === 'string' ? JSON.parse(response) : response;

    const pages = data.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    if (pageId === '-1') {
      logger.warn(`Article not found: ${title}`);
      return null;
    }

    const page = pages[pageId];
    const extract = page.extract || '';

    if (extract.length < 200) {
      logger.warn(`Article too short: ${title} (${extract.length} chars)`);
      return null;
    }

    // Extract section headings from the text
    const sections: string[] = [];
    const sectionMatches = extract.match(/^==+\s*(.+?)\s*==+$/gm);
    if (sectionMatches) {
      for (const match of sectionMatches) {
        const heading = match.replace(/^=+\s*|\s*=+$/g, '');
        if (heading && !heading.match(/^(See also|References|External links|Notes|Further reading|Bibliography)$/i)) {
          sections.push(heading);
        }
      }
    }

    // Get categories
    const categories: string[] = [];
    if (page.categories) {
      for (const cat of page.categories) {
        const catName = cat.title.replace('Category:', '');
        if (!catName.match(/^(Articles|Pages|All |Webarchive|CS1|Wikipedia)/i)) {
          categories.push(catName);
        }
      }
    }

    return {
      title: page.title,
      slug: slugify(page.title),
      extract,
      categories: categories.slice(0, 10), // Limit categories
      sections: sections.slice(0, 20), // Limit sections
      source: 'wikipedia',
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      scrapedAt: new Date().toISOString(),
      wordCount: extract.split(/\s+/).length,
    };
  } catch (e: any) {
    logger.warn(`Failed to fetch ${title}: ${e.message}`);
    return null;
  }
}

/**
 * Get existing files to skip
 */
function getExistingFiles(outputDir: string): Set<string> {
  const existing = new Set<string>();

  if (!existsSync(outputDir)) return existing;

  try {
    const files = readdirSync(outputDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        existing.add(file.replace('.json', ''));
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return existing;
}

/**
 * Download all articles for a category
 */
async function downloadCategory(categoryKey: string) {
  const category = TOPICS[categoryKey];
  if (!category) {
    logger.error(`Unknown category: ${categoryKey}`);
    logger.info('\nAvailable categories:');
    for (const key of Object.keys(TOPICS).sort()) {
      logger.info(`  ${key}`);
    }
    return;
  }

  const outputDir = join(OUTPUT_DIR, category.subcategory);
  logger.info(`\n=== Downloading: ${category.name} ===`);
  logger.info(`Output: ${outputDir}`);
  logger.info(`Articles: ${category.articles.length}`);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const existingFiles = getExistingFiles(outputDir);
  logger.info(`Already downloaded: ${existingFiles.size} files`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const title of category.articles) {
    const slug = slugify(title);

    if (existingFiles.has(slug)) {
      skipped++;
      continue;
    }

    await rateLimiter();
    const article = await fetchArticle(title);

    if (article) {
      const filepath = join(outputDir, `${slug}.json`);
      writeFileSync(filepath, JSON.stringify(article, null, 2));
      downloaded++;
      logger.info(`  [${downloaded}] ${article.title} (${article.wordCount} words)`);
    } else {
      failed++;
    }

    await sleep(100); // Small additional delay
  }

  logger.info('\n=== Download Complete ===');
  logger.success(`Downloaded: ${downloaded} articles`);
  logger.info(`Skipped (existing): ${skipped} articles`);
  if (failed > 0) {
    logger.warn(`Failed: ${failed} articles`);
  }
}

/**
 * List all available categories
 */
function listCategories() {
  logger.info('\n=== Available Categories ===\n');

  const bySubcategory: Record<string, { key: string; name: string; count: number }[]> = {};

  for (const [key, category] of Object.entries(TOPICS)) {
    const sub = category.subcategory.split('/')[0];
    if (!bySubcategory[sub]) bySubcategory[sub] = [];
    bySubcategory[sub].push({
      key,
      name: category.name,
      count: category.articles.length,
    });
  }

  for (const [sub, categories] of Object.entries(bySubcategory).sort()) {
    logger.info(`${sub.toUpperCase()}:`);
    for (const cat of categories) {
      logger.info(`  ${cat.key.padEnd(30)} ${cat.count.toString().padStart(3)} articles  - ${cat.name}`);
    }
    logger.info('');
  }

  const totalArticles = Object.values(TOPICS).reduce((sum, cat) => sum + cat.articles.length, 0);
  logger.info(`Total: ${Object.keys(TOPICS).length} categories, ${totalArticles} articles`);
}

/**
 * Download all categories
 */
async function downloadAll() {
  logger.info('\n=== Downloading ALL Categories ===\n');

  const categories = Object.keys(TOPICS).sort();
  let totalDownloaded = 0;

  for (const categoryKey of categories) {
    await downloadCategory(categoryKey);
    await sleep(2000); // Pause between categories
  }

  logger.success(`\nAll downloads complete!`);
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list') || args.includes('-l')) {
    listCategories();
    return;
  }

  if (args.includes('--all') || args.includes('-a')) {
    await downloadAll();
    return;
  }

  const categoryArg = args.find(a => a.startsWith('--category='));
  if (categoryArg) {
    const categoryKey = categoryArg.split('=')[1];
    await downloadCategory(categoryKey);
    return;
  }

  // No args - show help
  logger.info(`
Wikipedia Downloader - Fetch articles for question generation

Usage:
  bun src/download-wikipedia.ts --category=<name>   Download specific category
  bun src/download-wikipedia.ts --list              List available categories
  bun src/download-wikipedia.ts --all               Download all categories

Examples:
  bun src/download-wikipedia.ts --category=indian-history-ancient
  bun src/download-wikipedia.ts --category=physics
  bun src/download-wikipedia.ts --category=space
`);
}

main().catch(console.error);

export default { downloadCategory, listCategories, fetchArticle, TOPICS };
