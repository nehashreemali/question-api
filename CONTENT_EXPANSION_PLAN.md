# Content Expansion Plan - Road to 500K Questions

## Current Status
- **Existing Content:** ~7,500 units → ~170K questions
- **Target:** 500K questions
- **Gap:** ~330K questions needed

---

## Difficulty Tagging Strategy (Option C)

**Approach:** Scrape content by topic, then tag difficulty during question generation.

```
During Question Generation:
┌─────────────────────────────────────────────────────┐
│ AI analyzes each question and assigns:              │
│                                                     │
│ • grade_level: "5th", "8th", "10th", "college"     │
│ • difficulty: "easy", "medium", "hard"             │
│ • subject: "physics", "chemistry", "biology"       │
│                                                     │
│ Example:                                            │
│ Q: "What is the chemical symbol for water?"        │
│ → grade_level: "5th", difficulty: "easy"           │
│                                                     │
│ Q: "What is Heisenberg's uncertainty principle?"   │
│ → grade_level: "college", difficulty: "hard"       │
└─────────────────────────────────────────────────────┘
```

This lets us:
- Create "5th Grade Science Quiz" from the same content
- Filter by difficulty in the app
- No need to scrape separately by grade level

---

## Phase Overview

| Phase | Category | Sub-phases | Est. Pages | Est. Questions |
|-------|----------|------------|------------|----------------|
| **1** | History | 1a-1k | 600 | 90K |
| **2** | STEM | 2a-2e | 450 | 70K |
| **3** | Geography | 3a-3c | 200 | 30K |
| **4** | Sports | 4a-4b | 100 | 15K |
| **5** | Arts & Culture | 5a-5c | 150 | 22K |
| **6** | More TV Shows | 6a-6e | 3,000 eps | 75K |
| | **TOTAL** | | | **~302K new** |

**Grand Total: 170K + 302K = ~472K questions**

---

# Phase 1: History (Expanded)

## Phase 1a: Indian History - Ancient & Medieval
**Time:** ~45 mins | **Pages:** ~60 | **Questions:** ~9K

### Topics to Download
```
# Indus Valley Civilization
- Harappa
- Mohenjo-daro
- Indus Valley Civilization

# Maurya Empire
- Chandragupta Maurya
- Bindusara
- Ashoka the Great
- Mauryan Administration
- Arthashastra
- Chanakya

# Gupta Empire
- Chandragupta I
- Samudragupta
- Chandragupta II
- Gupta Golden Age
- Aryabhata
- Kalidasa

# South Indian Kingdoms
- Chola Dynasty
- Pandya Dynasty
- Chera Dynasty
- Pallava Dynasty
- Vijayanagara Empire
- Krishnadevaraya

# Delhi Sultanate
- Qutb ud-Din Aibak
- Iltutmish
- Razia Sultana
- Alauddin Khilji
- Muhammad bin Tughlaq
- Firuz Shah Tughlaq
- Lodi Dynasty
```

**Script:** `src/download-wikipedia.ts --category=indian-history-ancient`
**Output:** `generation/history/indian/ancient/`

**Status:** ⬜ Not Started

---

## Phase 1b: Indian History - Mughal Empire
**Time:** ~45 mins | **Pages:** ~50 | **Questions:** ~8K

### Topics to Download
```
# Mughal Emperors
- Babur (First Battle of Panipat 1526)
- Humayun
- Akbar the Great
- Jahangir
- Shah Jahan
- Aurangzeb
- Bahadur Shah I
- Later Mughals

# Key Battles
- First Battle of Panipat (1526)
- Second Battle of Panipat (1556)
- Third Battle of Panipat (1761)
- Battle of Khanwa
- Battle of Haldighati
- Battle of Talikota
- Battle of Plassey

# Mughal Culture & Administration
- Mughal Architecture
- Taj Mahal
- Red Fort
- Fatehpur Sikri
- Mughal Painting
- Din-i-Ilahi
- Mansabdari System
- Mughal Gardens

# Regional Powers (Mughal Era)
- Maratha Empire
- Shivaji Maharaj
- Sambhaji
- Peshwa Bajirao I
- Sikh Empire
- Guru Nanak
- Guru Gobind Singh
- Maharaja Ranjit Singh
- Rajput Kingdoms
- Rana Pratap
```

**Script:** `src/download-wikipedia.ts --category=indian-history-mughal`
**Output:** `generation/history/indian/mughal/`

**Status:** ⬜ Not Started

---

## Phase 1c: Indian History - British Raj & Independence
**Time:** ~45 mins | **Pages:** ~50 | **Questions:** ~8K

### Topics to Download
```
# East India Company Era
- British East India Company
- Battle of Plassey (1757)
- Battle of Buxar (1764)
- Robert Clive
- Warren Hastings
- Doctrine of Lapse
- Subsidiary Alliance

# 1857 Rebellion
- Indian Rebellion of 1857
- Rani Lakshmibai
- Mangal Pandey
- Tantia Tope
- Bahadur Shah Zafar
- Nana Sahib

# Freedom Movement
- Indian National Congress
- Mahatma Gandhi
- Jawaharlal Nehru
- Subhas Chandra Bose
- Bhagat Singh
- Sardar Vallabhbhai Patel
- B. R. Ambedkar
- Lala Lajpat Rai
- Bal Gangadhar Tilak

# Key Events
- Salt March (Dandi March)
- Quit India Movement
- Non-Cooperation Movement
- Civil Disobedience Movement
- Jallianwala Bagh Massacre
- Simon Commission
- Partition of India

# Independence
- Indian Independence Act 1947
- Constitution of India
- First Indian General Election
```

**Script:** `src/download-wikipedia.ts --category=indian-history-modern`
**Output:** `generation/history/indian/modern/`

**Status:** ⬜ Not Started

---

## Phase 1d: Ancient Civilizations - Egypt & Mesopotamia
**Time:** ~45 mins | **Pages:** ~60 | **Questions:** ~9K

### Topics to Download
```
# Egyptian Dynasties & Pharaohs
- Ancient Egypt
- Old Kingdom of Egypt
- Middle Kingdom of Egypt
- New Kingdom of Egypt
- Pharaoh
- Khufu (Cheops)
- Ramesses II
- Tutankhamun
- Cleopatra VII
- Hatshepsut
- Akhenaten
- Nefertiti

# Egyptian Culture
- Pyramids of Giza
- Great Sphinx of Giza
- Valley of the Kings
- Egyptian Hieroglyphs
- Book of the Dead
- Mummification
- Egyptian Gods (Ra, Osiris, Isis, Anubis)

# Mesopotamia
- Mesopotamia
- Sumer
- Akkadian Empire
- Babylon
- Hammurabi
- Code of Hammurabi
- Assyrian Empire
- Nebuchadnezzar II
- Hanging Gardens of Babylon
- Cuneiform
- Ziggurat
```

**Script:** `src/download-wikipedia.ts --category=ancient-egypt-mesopotamia`
**Output:** `generation/history/ancient/egypt-mesopotamia/`

**Status:** ⬜ Not Started

---

## Phase 1e: Ancient Civilizations - Greece & Rome
**Time:** ~60 mins | **Pages:** ~80 | **Questions:** ~12K

### Topics to Download
```
# Ancient Greece
- Ancient Greece
- Athens
- Sparta
- Greek Democracy
- Pericles
- Greek Philosophy
- Socrates
- Plato
- Aristotle
- Pythagoras
- Archimedes

# Greek Wars & Events
- Persian Wars
- Battle of Marathon
- Battle of Thermopylae (300 Spartans)
- Peloponnesian War
- Alexander the Great
- Hellenistic Period

# Roman Republic
- Ancient Rome
- Roman Republic
- Roman Senate
- Julius Caesar
- Pompey
- Marcus Brutus
- Cicero
- Punic Wars
- Hannibal Barca

# Roman Empire
- Roman Empire
- Augustus (Octavian)
- Nero
- Trajan
- Hadrian
- Marcus Aurelius
- Constantine the Great
- Fall of the Western Roman Empire
- Roman Architecture (Colosseum, Pantheon)
- Roman Roads
- Roman Legion
```

**Script:** `src/download-wikipedia.ts --category=ancient-greece-rome`
**Output:** `generation/history/ancient/greece-rome/`

**Status:** ⬜ Not Started

---

## Phase 1f: Ancient Civilizations - Persia, China, Others
**Time:** ~45 mins | **Pages:** ~50 | **Questions:** ~8K

### Topics to Download
```
# Persian Empire
- Achaemenid Empire
- Cyrus the Great
- Darius I
- Xerxes I
- Persepolis
- Persian Wars (Greek perspective already covered)

# Chinese Dynasties
- Ancient China
- Qin Dynasty
- Qin Shi Huang (First Emperor)
- Great Wall of China
- Terracotta Army
- Han Dynasty
- Tang Dynasty
- Ming Dynasty
- Qing Dynasty
- Forbidden City
- Confucius
- Silk Road

# Other Ancient Civilizations
- Phoenicia
- Carthage
- Mauryan Empire (cross-reference)
- Mayans
- Aztec Empire
- Inca Empire
```

**Script:** `src/download-wikipedia.ts --category=ancient-persia-china`
**Output:** `generation/history/ancient/persia-china/`

**Status:** ⬜ Not Started

---

## Phase 1g: Medieval History
**Time:** ~45 mins | **Pages:** ~60 | **Questions:** ~9K

### Topics to Download
```
# Byzantine Empire
- Byzantine Empire
- Justinian I
- Theodora (empress)
- Hagia Sophia
- Fall of Constantinople (1453)

# Islamic Golden Age
- Islamic Golden Age
- Umayyad Caliphate
- Abbasid Caliphate
- House of Wisdom
- Al-Khwarizmi (Algebra)
- Ibn Sina (Avicenna)
- Saladin

# Mongol Empire
- Mongol Empire
- Genghis Khan
- Kublai Khan
- Golden Horde
- Tamerlane (Timur)
- Mongol Conquests

# Medieval Europe
- Middle Ages
- Feudalism
- Crusades
- First Crusade
- Knights Templar
- Black Death
- Hundred Years' War
- Joan of Arc
- Holy Roman Empire
- Charlemagne
- Vikings
- Norman Conquest

# Ottoman Empire
- Ottoman Empire
- Osman I
- Mehmed the Conqueror
- Suleiman the Magnificent
- Siege of Constantinople
```

**Script:** `src/download-wikipedia.ts --category=medieval-history`
**Output:** `generation/history/medieval/`

**Status:** ⬜ Not Started

---

## Phase 1h: Renaissance, Exploration & Revolutions
**Time:** ~45 mins | **Pages:** ~60 | **Questions:** ~9K

### Topics to Download
```
# Renaissance
- Renaissance
- Italian Renaissance
- Florence
- Medici Family
- Renaissance Art
- Leonardo da Vinci
- Michelangelo
- Raphael
- Gutenberg Printing Press

# Age of Exploration
- Age of Discovery
- Christopher Columbus
- Vasco da Gama
- Ferdinand Magellan
- Amerigo Vespucci
- Hernán Cortés
- Francisco Pizarro
- Conquistadors

# Reformation
- Protestant Reformation
- Martin Luther
- 95 Theses
- John Calvin
- Henry VIII of England
- Counter-Reformation

# Industrial Revolution
- Industrial Revolution
- Steam Engine
- James Watt
- Spinning Jenny
- Factory System
- Child Labor
- Luddites
- Second Industrial Revolution

# Revolutions
- American Revolution
- Declaration of Independence
- George Washington
- French Revolution
- Storming of the Bastille
- Napoleon Bonaparte
- Napoleonic Wars
- Battle of Waterloo
```

**Script:** `src/download-wikipedia.ts --category=renaissance-revolutions`
**Output:** `generation/history/modern/renaissance-revolutions/`

**Status:** ⬜ Not Started

---

## Phase 1i: 20th Century - World Wars
**Time:** ~60 mins | **Pages:** ~80 | **Questions:** ~12K

### Topics to Download
```
# World War I
- World War I
- Causes of World War I
- Assassination of Archduke Franz Ferdinand
- Triple Alliance
- Triple Entente
- Trench Warfare
- Battle of the Somme
- Battle of Verdun
- Battle of Gallipoli
- Treaty of Versailles
- League of Nations
- Woodrow Wilson

# Interwar Period
- Great Depression
- Rise of Fascism
- Benito Mussolini
- Adolf Hitler
- Nazi Germany
- Weimar Republic
- Spanish Civil War

# World War II
- World War II
- Causes of World War II
- Invasion of Poland
- Battle of Britain
- Operation Barbarossa
- Pearl Harbor
- D-Day (Normandy Landings)
- Battle of Stalingrad
- Battle of Midway
- Holocaust
- Auschwitz
- Anne Frank
- Hiroshima and Nagasaki
- Atomic Bomb
- Manhattan Project
- Yalta Conference
- Potsdam Conference
- Nuremberg Trials

# WWII Leaders
- Winston Churchill
- Franklin D. Roosevelt
- Joseph Stalin
- Adolf Hitler
- Benito Mussolini
- Emperor Hirohito
- Charles de Gaulle
- Dwight D. Eisenhower
```

**Script:** `src/download-wikipedia.ts --category=world-wars`
**Output:** `generation/history/modern/world-wars/`

**Status:** ⬜ Not Started

---

## Phase 1j: 20th Century - Cold War & Modern
**Time:** ~45 mins | **Pages:** ~60 | **Questions:** ~9K

### Topics to Download
```
# Cold War
- Cold War
- Iron Curtain
- Berlin Wall
- Marshall Plan
- NATO
- Warsaw Pact
- Korean War
- Vietnam War
- Cuban Missile Crisis
- Bay of Pigs Invasion
- Space Race
- Sputnik
- Moon Landing (Apollo 11)
- Arms Race
- Proxy Wars
- Détente
- Glasnost
- Perestroika
- Fall of the Berlin Wall
- Dissolution of the Soviet Union

# Cold War Figures
- John F. Kennedy
- Nikita Khrushchev
- Leonid Brezhnev
- Mikhail Gorbachev
- Ronald Reagan
- Fidel Castro
- Ho Chi Minh
- Mao Zedong

# Modern Events
- September 11 Attacks
- War on Terror
- Gulf War
- European Union
- United Nations
- Decolonization
- Civil Rights Movement
- Martin Luther King Jr.
- Nelson Mandela
- Apartheid
```

**Script:** `src/download-wikipedia.ts --category=cold-war-modern`
**Output:** `generation/history/modern/cold-war/`

**Status:** ⬜ Not Started

---

## Phase 1k: Famous Historical Figures (Expanded)
**Time:** ~60 mins | **Pages:** ~80 | **Questions:** ~12K

### Topics to Download
```
# Scientists - Physics
- Isaac Newton
- Albert Einstein
- Galileo Galilei
- Nikola Tesla
- Michael Faraday
- James Clerk Maxwell
- Niels Bohr
- Werner Heisenberg
- Erwin Schrödinger
- Max Planck
- Richard Feynman
- Stephen Hawking
- Marie Curie
- Enrico Fermi
- Robert Oppenheimer

# Scientists - Other Fields
- Charles Darwin
- Gregor Mendel
- Louis Pasteur
- Alexander Fleming
- Watson and Crick
- Dmitri Mendeleev
- Antoine Lavoisier
- Carl Linnaeus
- Rachel Carson

# Inventors
- Thomas Edison
- Alexander Graham Bell
- Wright Brothers
- Guglielmo Marconi
- Tim Berners-Lee
- Steve Jobs
- Bill Gates

# Mathematicians
- Euclid
- Pythagoras
- Archimedes
- Isaac Newton (calculus)
- Gottfried Wilhelm Leibniz
- Carl Friedrich Gauss
- Leonhard Euler
- Srinivasa Ramanujan
- Alan Turing
- Ada Lovelace

# Philosophers
- Socrates
- Plato
- Aristotle
- Confucius
- Buddha
- René Descartes
- Immanuel Kant
- Friedrich Nietzsche
- Karl Marx

# Artists & Writers
- Leonardo da Vinci
- Michelangelo
- Vincent van Gogh
- Pablo Picasso
- William Shakespeare
- Leo Tolstoy
- Fyodor Dostoevsky
```

**Script:** `src/download-wikipedia.ts --category=historical-figures`
**Output:** `generation/history/figures/`

**Status:** ⬜ Not Started

---

# Phase 2: STEM (With Grade-Level Tagging)

> **Note:** Content scraped by topic. During question generation, AI will tag each question with:
> - `grade_level`: "elementary", "middle", "high", "college"
> - `difficulty`: "easy", "medium", "hard"

## Phase 2a: Physics
**Time:** ~60 mins | **Pages:** ~100 | **Questions:** ~15K

### Topics to Download
```
# Classical Mechanics
- Newton's laws of motion
- Force
- Mass
- Acceleration
- Velocity
- Speed
- Energy
- Kinetic energy
- Potential energy
- Momentum
- Gravity
- Work (physics)
- Power (physics)
- Friction
- Circular motion
- Simple harmonic motion
- Projectile motion

# Thermodynamics
- Thermodynamics
- Laws of thermodynamics
- Heat
- Temperature
- Entropy
- Heat transfer
- Conduction
- Convection
- Radiation
- Specific heat capacity
- Ideal gas law

# Electromagnetism
- Electric charge
- Electric current
- Voltage
- Resistance
- Ohm's law
- Electric field
- Magnetic field
- Electromagnet
- Electromagnetic induction
- Faraday's law
- Maxwell's equations
- Electric circuit
- Capacitor
- Inductor

# Waves & Optics
- Wave
- Wavelength
- Frequency
- Amplitude
- Sound
- Speed of sound
- Doppler effect
- Light
- Speed of light
- Reflection
- Refraction
- Snell's law
- Diffraction
- Interference
- Polarization
- Lens
- Mirror

# Modern Physics
- Special relativity
- General relativity
- E=mc²
- Time dilation
- Quantum mechanics
- Wave-particle duality
- Photoelectric effect
- Heisenberg uncertainty principle
- Schrödinger equation
- Atomic model
- Bohr model
- Electron
- Proton
- Neutron
- Quark

# Nuclear Physics
- Radioactivity
- Alpha particle
- Beta particle
- Gamma ray
- Half-life
- Nuclear fission
- Nuclear fusion
- Nuclear reactor
- Atomic bomb
- Chain reaction
```

**Script:** `src/download-wikipedia.ts --category=physics`
**Output:** `generation/stem/physics/`

**Status:** ⬜ Not Started

---

## Phase 2b: Chemistry
**Time:** ~60 mins | **Pages:** ~100 | **Questions:** ~15K

### Topics to Download
```
# Atomic Structure
- Atom
- Electron
- Proton
- Neutron
- Atomic number
- Mass number
- Isotope
- Ion
- Electron configuration
- Atomic orbital
- Valence electron

# Periodic Table
- Periodic table
- Chemical element
- Metals
- Nonmetals
- Metalloids
- Alkali metals
- Alkaline earth metals
- Halogens
- Noble gases
- Transition metals
- Lanthanides
- Actinides
- Hydrogen
- Oxygen
- Carbon
- Nitrogen
- Iron
- Gold
- Silver

# Chemical Bonding
- Chemical bond
- Covalent bond
- Ionic bond
- Metallic bond
- Hydrogen bond
- Van der Waals force
- Molecule
- Compound
- Lewis structure
- VSEPR theory

# States of Matter
- States of matter
- Solid
- Liquid
- Gas
- Plasma
- Phase transition
- Melting point
- Boiling point
- Sublimation
- Condensation

# Chemical Reactions
- Chemical reaction
- Chemical equation
- Reactant
- Product
- Catalyst
- Oxidation
- Reduction
- Redox reaction
- Combustion
- Synthesis reaction
- Decomposition reaction
- Acid-base reaction
- Precipitation reaction
- Exothermic reaction
- Endothermic reaction
- Activation energy
- Reaction rate
- Chemical equilibrium
- Le Chatelier's principle

# Acids & Bases
- Acid
- Base (chemistry)
- pH
- pH scale
- Neutralization
- Buffer solution
- Strong acid
- Weak acid
- Hydrochloric acid
- Sulfuric acid
- Sodium hydroxide

# Organic Chemistry
- Organic chemistry
- Organic compound
- Hydrocarbon
- Alkane
- Alkene
- Alkyne
- Aromatic compound
- Benzene
- Functional group
- Alcohol
- Aldehyde
- Ketone
- Carboxylic acid
- Ester
- Amine
- Polymer
- Isomer

# Biochemistry
- Biochemistry
- Carbohydrate
- Glucose
- Starch
- Cellulose
- Lipid
- Fat
- Protein
- Amino acid
- Enzyme
- DNA
- RNA
- Nucleotide
- ATP
```

**Script:** `src/download-wikipedia.ts --category=chemistry`
**Output:** `generation/stem/chemistry/`

**Status:** ⬜ Not Started

---

## Phase 2c: Biology
**Time:** ~60 mins | **Pages:** ~100 | **Questions:** ~15K

### Topics to Download
```
# Cell Biology
- Cell (biology)
- Cell theory
- Prokaryote
- Eukaryote
- Cell membrane
- Cell wall
- Cytoplasm
- Nucleus
- Nucleolus
- Ribosome
- Endoplasmic reticulum
- Golgi apparatus
- Mitochondria
- Chloroplast
- Vacuole
- Lysosome
- Cytoskeleton

# Cell Division
- Cell division
- Cell cycle
- Mitosis
- Meiosis
- Chromosome
- Chromatid
- Centromere
- Interphase
- Prophase
- Metaphase
- Anaphase
- Telophase
- Cytokinesis

# Genetics
- Genetics
- Gene
- Allele
- Genotype
- Phenotype
- Dominant
- Recessive
- Heredity
- Mendel's laws
- Punnett square
- DNA
- RNA
- DNA replication
- Transcription
- Translation
- Genetic code
- Mutation
- Genetic engineering
- CRISPR
- Cloning
- Human Genome Project

# Evolution
- Evolution
- Natural selection
- Charles Darwin
- Origin of Species
- Adaptation
- Speciation
- Fossil
- Homologous structure
- Vestigial structure
- Common ancestor
- Phylogenetics
- Extinction

# Human Body Systems
- Human body
- Circulatory system
- Heart
- Blood
- Blood vessel
- Respiratory system
- Lung
- Breathing
- Digestive system
- Stomach
- Intestine
- Liver
- Nervous system
- Brain
- Neuron
- Spinal cord
- Skeletal system
- Bone
- Muscular system
- Muscle
- Immune system
- Antibody
- White blood cell
- Endocrine system
- Hormone
- Reproductive system

# Ecology
- Ecology
- Ecosystem
- Biome
- Food chain
- Food web
- Producer
- Consumer
- Decomposer
- Photosynthesis
- Cellular respiration
- Carbon cycle
- Nitrogen cycle
- Water cycle
- Biodiversity
- Endangered species
- Conservation biology

# Microbiology
- Microbiology
- Bacteria
- Virus
- Fungi
- Protist
- Antibiotic
- Vaccine
- Immune response
- Pathogen
- Infection
```

**Script:** `src/download-wikipedia.ts --category=biology`
**Output:** `generation/stem/biology/`

**Status:** ⬜ Not Started

---

## Phase 2d: Space & Astronomy
**Time:** ~45 mins | **Pages:** ~70 | **Questions:** ~10K

### Topics to Download
```
# Solar System
- Solar System
- Sun
- Mercury (planet)
- Venus
- Earth
- Mars
- Jupiter
- Saturn
- Uranus
- Neptune
- Pluto
- Moon
- Lunar eclipse
- Solar eclipse
- Asteroid
- Asteroid belt
- Comet
- Meteor
- Meteorite

# Stars & Stellar Evolution
- Star
- Stellar evolution
- Nebula
- Protostar
- Main sequence
- Red giant
- White dwarf
- Supernova
- Neutron star
- Pulsar
- Black hole
- Binary star
- Constellation
- North Star

# Galaxies & Universe
- Galaxy
- Milky Way
- Andromeda Galaxy
- Spiral galaxy
- Elliptical galaxy
- Quasar
- Universe
- Big Bang
- Cosmic microwave background
- Dark matter
- Dark energy
- Expansion of the universe
- Hubble's law

# Space Exploration
- Space exploration
- NASA
- ISRO
- ESA
- SpaceX
- Roscosmos
- Rocket
- Satellite
- Space station
- International Space Station
- Apollo program
- Apollo 11
- Moon landing
- Neil Armstrong
- Buzz Aldrin
- Mars rover
- Curiosity rover
- Perseverance rover
- Voyager program
- Hubble Space Telescope
- James Webb Space Telescope
- Space Shuttle
- Yuri Gagarin
- First human in space
```

**Script:** `src/download-wikipedia.ts --category=space`
**Output:** `generation/stem/space/`

**Status:** ⬜ Not Started

---

## Phase 2e: Mathematics Concepts
**Time:** ~45 mins | **Pages:** ~70 | **Questions:** ~10K

### Topics to Download
```
# Basic Math
- Number
- Integer
- Fraction
- Decimal
- Percentage
- Ratio
- Proportion
- Prime number
- Composite number
- Factor
- Multiple
- Greatest common divisor
- Least common multiple

# Algebra
- Algebra
- Variable
- Equation
- Linear equation
- Quadratic equation
- Polynomial
- Function
- Graph of a function
- Slope
- Y-intercept
- System of equations
- Inequality
- Exponent
- Logarithm
- Square root

# Geometry
- Geometry
- Point
- Line
- Plane
- Angle
- Triangle
- Pythagorean theorem
- Quadrilateral
- Rectangle
- Square
- Circle
- Area
- Perimeter
- Volume
- Surface area
- Congruence
- Similarity
- Parallel lines
- Perpendicular lines
- Coordinate geometry

# Trigonometry
- Trigonometry
- Sine
- Cosine
- Tangent
- Unit circle
- Trigonometric identity
- Law of sines
- Law of cosines

# Calculus
- Calculus
- Limit
- Derivative
- Differentiation
- Integral
- Integration
- Fundamental theorem of calculus
- Chain rule
- Product rule

# Statistics & Probability
- Statistics
- Mean
- Median
- Mode
- Standard deviation
- Variance
- Probability
- Permutation
- Combination
- Normal distribution
- Binomial distribution

# Famous Theorems
- Pythagorean theorem
- Fermat's Last Theorem
- Goldbach conjecture
- Riemann hypothesis
```

**Script:** `src/download-wikipedia.ts --category=mathematics`
**Output:** `generation/stem/mathematics/`

**Status:** ⬜ Not Started

---

# Phase 3: Geography

## Phase 3a: Countries & Capitals
**Time:** ~60 mins | **Pages:** ~80 | **Questions:** ~12K

### Topics to Download
```
# Major World Countries (G20 + important)
- United States
- Canada
- Mexico
- Brazil
- Argentina
- United Kingdom
- France
- Germany
- Italy
- Spain
- Russia
- China
- Japan
- South Korea
- India
- Australia
- South Africa
- Egypt
- Saudi Arabia
- Turkey
- Indonesia
- Nigeria

# Continents
- Asia
- Europe
- Africa
- North America
- South America
- Australia (continent)
- Oceania
- Antarctica

# World Capitals
- List of national capitals
- Washington D.C.
- London
- Paris
- Berlin
- Tokyo
- Beijing
- New Delhi
- Moscow
- Canberra
```

**Script:** `src/download-wikipedia.ts --category=geography-countries`
**Output:** `generation/geography/countries/`

**Status:** ⬜ Not Started

---

## Phase 3b: Physical Geography
**Time:** ~45 mins | **Pages:** ~60 | **Questions:** ~9K

### Topics to Download
```
# Mountains
- Himalayas
- Mount Everest
- K2
- Alps
- Andes
- Rocky Mountains
- Kilimanjaro
- Denali
- Mont Blanc
- Matterhorn

# Rivers
- Ganges
- Nile
- Amazon River
- Mississippi River
- Yangtze River
- Danube
- Brahmaputra
- Indus River
- Thames
- Seine

# Deserts
- Sahara
- Thar Desert
- Gobi Desert
- Arabian Desert
- Kalahari Desert
- Atacama Desert
- Mojave Desert

# Oceans & Seas
- Pacific Ocean
- Atlantic Ocean
- Indian Ocean
- Arctic Ocean
- Southern Ocean
- Mediterranean Sea
- Caribbean Sea
- Red Sea
- Arabian Sea
- Bay of Bengal

# Other Features
- Great Barrier Reef
- Amazon Rainforest
- Great Lakes
- Lake Baikal
- Mariana Trench
- Ring of Fire
- Tectonic plates
```

**Script:** `src/download-wikipedia.ts --category=geography-physical`
**Output:** `generation/geography/physical/`

**Status:** ⬜ Not Started

---

## Phase 3c: World Landmarks & Wonders
**Time:** ~30 mins | **Pages:** ~40 | **Questions:** ~6K

### Topics to Download
```
# Man-made Wonders
- Seven Wonders of the Ancient World
- New Seven Wonders of the World
- Taj Mahal
- Great Wall of China
- Eiffel Tower
- Colosseum
- Machu Picchu
- Petra
- Christ the Redeemer
- Pyramids of Giza
- Statue of Liberty
- Big Ben
- Sydney Opera House
- Burj Khalifa
- Angkor Wat

# Natural Wonders
- Grand Canyon
- Victoria Falls
- Northern Lights (Aurora)
- Great Barrier Reef
- Mount Everest
- Amazon River
- Niagara Falls
- Iguazu Falls
- Ha Long Bay
- Yellowstone National Park
```

**Script:** `src/download-wikipedia.ts --category=geography-landmarks`
**Output:** `generation/geography/landmarks/`

**Status:** ⬜ Not Started

---

# Phase 4: Sports (Minimal)

## Phase 4a: Cricket Basics
**Time:** ~30 mins | **Pages:** ~40 | **Questions:** ~6K

### Topics to Download
```
# World Cups
- Cricket World Cup
- ICC T20 World Cup
- 1983 Cricket World Cup
- 2011 Cricket World Cup
- 2023 Cricket World Cup

# Legends
- Sachin Tendulkar
- Virat Kohli
- MS Dhoni
- Kapil Dev
- Sunil Gavaskar
- Don Bradman
- Shane Warne
- Brian Lara
- Ricky Ponting

# IPL
- Indian Premier League
```

**Script:** `src/download-wikipedia.ts --category=cricket`
**Output:** `generation/sports/cricket/`

**Status:** ⬜ Not Started

---

## Phase 4b: Football & Olympics Basics
**Time:** ~30 mins | **Pages:** ~40 | **Questions:** ~6K

### Topics to Download
```
# Football/Soccer
- FIFA World Cup
- Lionel Messi
- Cristiano Ronaldo
- Pelé
- Diego Maradona
- UEFA Champions League

# Olympics
- Olympic Games
- Summer Olympic Games
- Winter Olympic Games
- Usain Bolt
- Michael Phelps
```

**Script:** `src/download-wikipedia.ts --category=sports-misc`
**Output:** `generation/sports/`

**Status:** ⬜ Not Started

---

# Phase 5: Arts & Culture (NEW)

## Phase 5a: Art History
**Time:** ~45 mins | **Pages:** ~50 | **Questions:** ~8K

### Topics to Download
```
# Art Movements
- Renaissance art
- Baroque
- Romanticism
- Impressionism
- Post-Impressionism
- Cubism
- Surrealism
- Abstract art
- Pop art

# Famous Artists
- Leonardo da Vinci
- Michelangelo
- Raphael
- Rembrandt
- Vincent van Gogh
- Claude Monet
- Pablo Picasso
- Salvador Dalí
- Frida Kahlo
- Andy Warhol

# Famous Artworks
- Mona Lisa
- The Last Supper
- Sistine Chapel ceiling
- The Starry Night
- Girl with a Pearl Earring
- The Scream
- Guernica
```

**Script:** `src/download-wikipedia.ts --category=art-history`
**Output:** `generation/arts/art-history/`

**Status:** ⬜ Not Started

---

## Phase 5b: Music History
**Time:** ~45 mins | **Pages:** ~50 | **Questions:** ~8K

### Topics to Download
```
# Classical Music
- Classical music
- Wolfgang Amadeus Mozart
- Ludwig van Beethoven
- Johann Sebastian Bach
- Frédéric Chopin
- Pyotr Ilyich Tchaikovsky
- Symphony
- Concerto
- Opera

# Modern Music
- Rock music
- The Beatles
- Elvis Presley
- Michael Jackson
- Queen (band)
- Led Zeppelin
- Pink Floyd
- Pop music
- Hip hop music
- Jazz
- Blues
```

**Script:** `src/download-wikipedia.ts --category=music-history`
**Output:** `generation/arts/music/`

**Status:** ⬜ Not Started

---

## Phase 5c: Inventions & Discoveries
**Time:** ~45 mins | **Pages:** ~50 | **Questions:** ~8K

### Topics to Download
```
# Ancient Inventions
- Wheel
- Writing
- Paper
- Compass
- Gunpowder
- Printing press

# Industrial Era
- Steam engine
- Locomotive
- Telegraph
- Telephone
- Light bulb
- Automobile
- Airplane

# Modern Inventions
- Radio
- Television
- Computer
- Internet
- World Wide Web
- Smartphone
- GPS
- Vaccine
- Antibiotic
- Penicillin
- X-ray
```

**Script:** `src/download-wikipedia.ts --category=inventions`
**Output:** `generation/arts/inventions/`

**Status:** ⬜ Not Started

---

# Phase 6: More TV Shows

## Phase 6a: Animated Shows
**Time:** ~2 hrs | **Episodes:** ~700 | **Questions:** ~17K

### Shows to Download
```
- The Simpsons (S1-20): 440 episodes
- South Park (S1-20): 280 episodes
```

**Status:** ⬜ Not Started

---

## Phase 6b: Drama Shows
**Time:** ~2 hrs | **Episodes:** ~600 | **Questions:** ~15K

### Shows to Download
```
- House MD: 177 episodes
- Lost: 121 episodes
- Grey's Anatomy (S1-10): ~220 episodes
- Stranger Things: 34 episodes
```

**Status:** ⬜ Not Started

---

## Phase 6c: Comedy Shows
**Time:** ~1.5 hrs | **Episodes:** ~400 | **Questions:** ~10K

### Shows to Download
```
- Modern Family: 250 episodes
- The Good Place: 53 episodes
- Arrested Development: 84 episodes
```

**Status:** ⬜ Not Started

---

## Phase 6d: More Sitcoms
**Time:** ~1.5 hrs | **Episodes:** ~400 | **Questions:** ~10K

### Shows to Download
```
- It's Always Sunny in Philadelphia: 172 episodes
- 30 Rock: 138 episodes
- Schitt's Creek: 80 episodes
```

**Status:** ⬜ Not Started

---

## Phase 6e: Dramas & Thrillers
**Time:** ~1.5 hrs | **Episodes:** ~400 | **Questions:** ~10K

### Shows to Download
```
- Better Call Saul: 63 episodes
- The Walking Dead: 177 episodes
- Supernatural (S1-10): ~220 episodes
```

**Status:** ⬜ Not Started

---

# Execution Checklist

## Week 1

### Day 1: Indian History
- [ ] **Phase 1a:** Ancient & Medieval India (~45 mins)
- [ ] **Phase 1b:** Mughal Empire (~45 mins)
- [ ] **Phase 1c:** British Raj & Independence (~45 mins)
- [ ] Commit & push

### Day 2: World History - Ancient
- [ ] **Phase 1d:** Egypt & Mesopotamia (~45 mins)
- [ ] **Phase 1e:** Greece & Rome (~60 mins)
- [ ] **Phase 1f:** Persia, China & Others (~45 mins)
- [ ] Commit & push

### Day 3: World History - Medieval to Modern
- [ ] **Phase 1g:** Medieval History (~45 mins)
- [ ] **Phase 1h:** Renaissance & Revolutions (~45 mins)
- [ ] **Phase 1i:** World Wars (~60 mins)
- [ ] **Phase 1j:** Cold War & Modern (~45 mins)
- [ ] Commit & push

### Day 4: Historical Figures + STEM Start
- [ ] **Phase 1k:** Famous Figures (~60 mins)
- [ ] **Phase 2a:** Physics (~60 mins)
- [ ] Commit & push

### Day 5: STEM
- [ ] **Phase 2b:** Chemistry (~60 mins)
- [ ] **Phase 2c:** Biology (~60 mins)
- [ ] **Phase 2d:** Space & Astronomy (~45 mins)
- [ ] **Phase 2e:** Mathematics (~45 mins)
- [ ] Commit & push

### Day 6: Geography, Sports, Arts
- [ ] **Phase 3a:** Countries & Capitals (~60 mins)
- [ ] **Phase 3b:** Physical Geography (~45 mins)
- [ ] **Phase 3c:** World Landmarks (~30 mins)
- [ ] **Phase 4a:** Cricket Basics (~30 mins)
- [ ] **Phase 4b:** Football & Olympics (~30 mins)
- [ ] **Phase 5a:** Art History (~45 mins)
- [ ] **Phase 5b:** Music History (~45 mins)
- [ ] **Phase 5c:** Inventions (~45 mins)
- [ ] Commit & push

### Day 7-8: TV Shows
- [ ] **Phase 6a:** Animated Shows (~2 hrs)
- [ ] **Phase 6b:** Drama Shows (~2 hrs)
- [ ] **Phase 6c:** Comedy Shows (~1.5 hrs)
- [ ] **Phase 6d:** More Sitcoms (~1.5 hrs)
- [ ] **Phase 6e:** Dramas & Thrillers (~1.5 hrs)
- [ ] Commit & push

---

# Scripts Needed

| Script | Purpose | Status |
|--------|---------|--------|
| `src/download-wikipedia.ts` | Generic Wikipedia scraper | ⬜ Create |
| `src/download-transcripts.ts` | TV show scraper | ✅ Exists |

---

# Final Summary

| Phase | Content | Questions |
|-------|---------|-----------|
| Phase 1 | History (expanded) | 95K |
| Phase 2 | STEM | 65K |
| Phase 3 | Geography | 27K |
| Phase 4 | Sports (minimal) | 12K |
| Phase 5 | Arts & Culture | 24K |
| Phase 6 | TV Shows | 62K |
| **New** | | **285K** |
| **Existing** | | **170K** |
| **TOTAL** | | **~455K** |

To reach 500K+, we can add:
- More TV shows
- Gaming wikis (Pokémon, Zelda)
- Literature (more authors)
- More sports if needed

---

_Last updated: January 2026_
