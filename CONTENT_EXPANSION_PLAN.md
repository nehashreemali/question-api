# Content Expansion Plan - Road to 500K Questions

## Current Status
- **Existing Content:** ~7,500 units → ~170K questions
- **Target:** 500K questions
- **Gap:** ~330K questions needed

---

## Phase Overview

| Phase | Category | Sub-phases | Est. Pages | Est. Questions |
|-------|----------|------------|------------|----------------|
| **1** | History | 1a-1c | 450 | 70K |
| **2** | STEM | 2a-2d | 400 | 60K |
| **3** | Geography | 3a-3c | 200 | 30K |
| **4** | Sports | 4a-4b | 100 | 15K |
| **5** | More TV Shows | 5a-5e | 3,000 eps | 75K |
| | **TOTAL** | | | **~250K new** |

**Grand Total: 170K + 250K = ~420K questions**

---

# Phase 1: History

## Phase 1a: Indian History - Ancient & Medieval
**Time:** ~45 mins | **Pages:** ~60 | **Questions:** ~9K

### Topics to Download
```
# Maurya Empire
- Chandragupta Maurya
- Bindusara
- Ashoka the Great
- Mauryan Administration
- Arthashastra

# Gupta Empire
- Chandragupta I
- Samudragupta
- Chandragupta II
- Gupta Golden Age
- Aryabhata, Kalidasa

# South Indian Kingdoms
- Chola Dynasty
- Pandya Dynasty
- Chera Dynasty
- Pallava Dynasty
- Vijayanagara Empire

# Delhi Sultanate
- Qutb ud-Din Aibak
- Iltutmish
- Razia Sultana
- Alauddin Khilji
- Muhammad bin Tughlaq
- Firuz Shah Tughlaq
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
- Babur (Battle of Panipat 1526)
- Humayun
- Akbar the Great
- Jahangir
- Shah Jahan
- Aurangzeb
- Later Mughals

# Key Events
- First Battle of Panipat
- Second Battle of Panipat
- Third Battle of Panipat
- Battle of Haldighati
- Battle of Talikota

# Mughal Culture
- Mughal Architecture (Taj Mahal, Red Fort)
- Mughal Art & Painting
- Din-i-Ilahi
- Mansabdari System

# Regional Powers
- Maratha Empire
- Shivaji Maharaj
- Peshwas
- Sikh Empire
- Ranjit Singh
```

**Script:** `src/download-wikipedia.ts --category=indian-history-mughal`
**Output:** `generation/history/indian/mughal/`

**Status:** ⬜ Not Started

---

## Phase 1c: Indian History - British Raj & Independence
**Time:** ~45 mins | **Pages:** ~50 | **Questions:** ~8K

### Topics to Download
```
# East India Company
- Battle of Plassey
- Battle of Buxar
- Robert Clive
- Warren Hastings
- Doctrine of Lapse

# 1857 & After
- Indian Rebellion of 1857
- Rani Lakshmibai
- Mangal Pandey
- British Crown Rule

# Freedom Movement
- Indian National Congress
- Mahatma Gandhi
- Jawaharlal Nehru
- Subhas Chandra Bose
- Bhagat Singh
- Quit India Movement
- Salt March
- Non-Cooperation Movement

# Independence
- Partition of India
- Independence Day 1947
- Constitution of India
- Sardar Patel
```

**Script:** `src/download-wikipedia.ts --category=indian-history-modern`
**Output:** `generation/history/indian/modern/`

**Status:** ⬜ Not Started

---

## Phase 1d: World History - Ancient
**Time:** ~45 mins | **Pages:** ~60 | **Questions:** ~9K

### Topics to Download
```
# Ancient Egypt
- Egyptian Pharaohs
- Pyramids of Giza
- Tutankhamun
- Cleopatra
- Nile River civilization

# Ancient Greece
- Athens & Sparta
- Alexander the Great
- Greek Philosophy (Socrates, Plato, Aristotle)
- Persian Wars
- Peloponnesian War

# Roman Empire
- Julius Caesar
- Augustus
- Roman Republic
- Fall of Rome
- Roman Architecture

# Other Civilizations
- Persian Empire
- Ancient China (Qin, Han)
- Mesopotamia
```

**Script:** `src/download-wikipedia.ts --category=world-history-ancient`
**Output:** `generation/history/world/ancient/`

**Status:** ⬜ Not Started

---

## Phase 1e: World History - Medieval & Modern
**Time:** ~45 mins | **Pages:** ~60 | **Questions:** ~9K

### Topics to Download
```
# Medieval
- Crusades
- Mongol Empire
- Genghis Khan
- Byzantine Empire
- Islamic Golden Age
- Black Death

# Renaissance & Exploration
- Renaissance
- Age of Exploration
- Christopher Columbus
- Vasco da Gama
- Protestant Reformation

# Modern Era
- French Revolution
- Napoleon Bonaparte
- Industrial Revolution
- American Revolution
- American Civil War
```

**Script:** `src/download-wikipedia.ts --category=world-history-medieval`
**Output:** `generation/history/world/medieval/`

**Status:** ⬜ Not Started

---

## Phase 1f: World History - 20th Century
**Time:** ~60 mins | **Pages:** ~80 | **Questions:** ~12K

### Topics to Download
```
# World War I
- Causes of WWI
- Major Battles (Somme, Verdun)
- Treaty of Versailles
- Ottoman Empire collapse

# World War II
- Adolf Hitler
- Nazi Germany
- Holocaust
- D-Day
- Pearl Harbor
- Hiroshima & Nagasaki
- Winston Churchill
- Franklin Roosevelt
- Joseph Stalin

# Cold War
- Cold War
- Korean War
- Vietnam War
- Cuban Missile Crisis
- Space Race
- Berlin Wall
- Fall of Soviet Union
```

**Script:** `src/download-wikipedia.ts --category=world-history-20th`
**Output:** `generation/history/world/modern/`

**Status:** ⬜ Not Started

---

## Phase 1g: Historical Figures
**Time:** ~30 mins | **Pages:** ~40 | **Questions:** ~6K

### Topics to Download
```
# Conquerors & Leaders
- Alexander the Great
- Genghis Khan
- Napoleon Bonaparte
- Julius Caesar

# Scientists & Inventors
- Isaac Newton
- Albert Einstein
- Marie Curie
- Charles Darwin
- Nikola Tesla
- Thomas Edison

# Philosophers
- Socrates
- Plato
- Aristotle
- Confucius

# Artists
- Leonardo da Vinci
- Michelangelo
- Vincent van Gogh
```

**Script:** `src/download-wikipedia.ts --category=historical-figures`
**Output:** `generation/history/figures/`

**Status:** ⬜ Not Started

---

# Phase 2: STEM

## Phase 2a: Physics
**Time:** ~60 mins | **Pages:** ~100 | **Questions:** ~15K

### Topics to Download
```
# Classical Mechanics
- Newton's laws of motion
- Force
- Energy
- Momentum
- Gravity
- Work (physics)
- Power (physics)

# Thermodynamics
- Laws of thermodynamics
- Heat
- Temperature
- Entropy

# Electromagnetism
- Electric charge
- Electric field
- Magnetic field
- Electromagnetic induction
- Maxwell's equations

# Waves & Optics
- Wave
- Sound
- Light
- Reflection
- Refraction
- Interference

# Modern Physics
- Special relativity
- General relativity
- Quantum mechanics
- Photoelectric effect
- Atomic model

# Nuclear
- Radioactivity
- Nuclear fission
- Nuclear fusion
- Half-life
```

**Script:** `src/download-wikipedia.ts --category=physics`
**Output:** `generation/stem/physics/`

**Status:** ⬜ Not Started

---

## Phase 2b: Chemistry
**Time:** ~45 mins | **Pages:** ~80 | **Questions:** ~12K

### Topics to Download
```
# General Chemistry
- Atom
- Periodic table
- Chemical element
- Chemical bond
- Covalent bond
- Ionic bond
- Molecule
- States of matter

# Reactions
- Chemical reaction
- Oxidation-reduction
- Acid-base reaction
- Combustion
- Catalyst

# Organic Chemistry
- Organic compound
- Hydrocarbon
- Alkane, Alkene, Alkyne
- Functional group
- Polymer

# Biochemistry
- Protein
- DNA
- RNA
- Enzyme
- Carbohydrate
- Lipid
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
- Prokaryote
- Eukaryote
- Cell membrane
- Nucleus
- Mitochondria
- Chloroplast
- Cell division
- Mitosis
- Meiosis

# Genetics
- Gene
- Chromosome
- DNA replication
- Genetic mutation
- Heredity
- Mendel's laws
- Genetic engineering

# Evolution
- Evolution
- Natural selection
- Charles Darwin
- Speciation
- Fossil

# Human Body
- Circulatory system
- Respiratory system
- Digestive system
- Nervous system
- Skeletal system
- Muscular system
- Immune system

# Ecology
- Ecosystem
- Food chain
- Biodiversity
- Photosynthesis
```

**Script:** `src/download-wikipedia.ts --category=biology`
**Output:** `generation/stem/biology/`

**Status:** ⬜ Not Started

---

## Phase 2d: Space & Astronomy
**Time:** ~45 mins | **Pages:** ~60 | **Questions:** ~9K

### Topics to Download
```
# Solar System
- Sun
- Mercury, Venus, Earth, Mars
- Jupiter, Saturn, Uranus, Neptune
- Moon
- Asteroid
- Comet
- Dwarf planet (Pluto)

# Stars & Galaxies
- Star
- Black hole
- Supernova
- Milky Way
- Galaxy

# Space Exploration
- NASA
- ISRO
- Apollo program
- Moon landing
- Mars rover
- International Space Station
- SpaceX
- Voyager program
- Hubble Space Telescope
- James Webb Space Telescope

# Cosmology
- Big Bang
- Universe
- Dark matter
- Dark energy
```

**Script:** `src/download-wikipedia.ts --category=space`
**Output:** `generation/stem/space/`

**Status:** ⬜ Not Started

---

# Phase 3: Geography

## Phase 3a: Countries & Capitals
**Time:** ~60 mins | **Pages:** ~80 | **Questions:** ~12K

### Topics to Download
```
# Major Countries (G20 + important)
- United States, Canada, Mexico, Brazil, Argentina
- United Kingdom, France, Germany, Italy, Spain
- Russia, China, Japan, South Korea, India
- Australia, South Africa, Egypt, Saudi Arabia
- And capitals, key facts for each

# Continents
- Asia, Europe, Africa
- North America, South America
- Australia/Oceania, Antarctica
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
- Himalayas, Mount Everest, K2
- Alps, Andes, Rockies
- Kilimanjaro, Denali

# Rivers
- Ganges, Nile, Amazon
- Mississippi, Yangtze, Danube
- Brahmaputra, Indus

# Deserts
- Sahara, Thar, Gobi
- Arabian, Kalahari, Atacama

# Oceans & Seas
- Pacific, Atlantic, Indian, Arctic
- Mediterranean, Caribbean, Red Sea

# Other
- Great Barrier Reef
- Amazon Rainforest
- Major lakes
```

**Script:** `src/download-wikipedia.ts --category=geography-physical`
**Output:** `generation/geography/physical/`

**Status:** ⬜ Not Started

---

## Phase 3c: World Landmarks
**Time:** ~30 mins | **Pages:** ~40 | **Questions:** ~6K

### Topics to Download
```
# Man-made Wonders
- Taj Mahal
- Great Wall of China
- Eiffel Tower
- Colosseum
- Machu Picchu
- Petra
- Christ the Redeemer
- Pyramids of Giza
- Statue of Liberty

# Natural Wonders
- Grand Canyon
- Victoria Falls
- Northern Lights
- Great Barrier Reef
- Mount Everest
- Amazon River
- Niagara Falls
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
- Cricket World Cup (overview)
- ICC T20 World Cup (overview)
- 2011 Cricket World Cup
- 2023 Cricket World Cup

# Legends
- Sachin Tendulkar
- Virat Kohli
- MS Dhoni
- Kapil Dev
- Don Bradman
- Shane Warne

# Teams
- India national cricket team
- Australia national cricket team

# IPL
- Indian Premier League (overview)
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
- FIFA World Cup (overview)
- Lionel Messi
- Cristiano Ronaldo
- Pelé
- Diego Maradona
- UEFA Champions League

# Olympics
- Olympic Games (overview)
- Summer Olympic Games
- Usain Bolt
- Michael Phelps
```

**Script:** `src/download-wikipedia.ts --category=sports-misc`
**Output:** `generation/sports/`

**Status:** ⬜ Not Started

---

# Phase 5: More TV Shows

## Phase 5a: Animated Shows
**Time:** ~2 hrs | **Episodes:** ~700 | **Questions:** ~17K

### Shows to Download
```
- The Simpsons (S1-20): 440 episodes
- South Park (S1-20): 280 episodes
```

**Script:** `src/download-transcripts.ts` (update SHOWS array)
**Output:** `generation/transcripts/`

**Status:** ⬜ Not Started

---

## Phase 5b: Drama Shows
**Time:** ~2 hrs | **Episodes:** ~600 | **Questions:** ~15K

### Shows to Download
```
- House MD: 177 episodes
- Lost: 121 episodes
- Grey's Anatomy (S1-10): ~220 episodes
- Stranger Things: 34 episodes
```

**Script:** `src/download-transcripts.ts` (update SHOWS array)
**Output:** `generation/transcripts/`

**Status:** ⬜ Not Started

---

## Phase 5c: Comedy Shows
**Time:** ~1.5 hrs | **Episodes:** ~400 | **Questions:** ~10K

### Shows to Download
```
- Modern Family: 250 episodes
- The Good Place: 53 episodes
- Arrested Development: 84 episodes
```

**Script:** `src/download-transcripts.ts` (update SHOWS array)
**Output:** `generation/transcripts/`

**Status:** ⬜ Not Started

---

## Phase 5d: More Sitcoms
**Time:** ~1.5 hrs | **Episodes:** ~400 | **Questions:** ~10K

### Shows to Download
```
- It's Always Sunny in Philadelphia: 172 episodes
- 30 Rock: 138 episodes
- Schitt's Creek: 80 episodes
```

**Script:** `src/download-transcripts.ts` (update SHOWS array)
**Output:** `generation/transcripts/`

**Status:** ⬜ Not Started

---

## Phase 5e: Dramas & Thrillers
**Time:** ~1.5 hrs | **Episodes:** ~400 | **Questions:** ~10K

### Shows to Download
```
- Better Call Saul: 63 episodes
- The Walking Dead: 177 episodes
- Supernatural (S1-10): ~220 episodes
```

**Script:** `src/download-transcripts.ts` (update SHOWS array)
**Output:** `generation/transcripts/`

**Status:** ⬜ Not Started

---

# Execution Checklist

## Week 1

### Day 1: Indian History
- [ ] **Phase 1a:** Ancient & Medieval India (~45 mins)
- [ ] **Phase 1b:** Mughal Empire (~45 mins)
- [ ] **Phase 1c:** British Raj & Independence (~45 mins)
- [ ] Commit & push

### Day 2: World History
- [ ] **Phase 1d:** Ancient History (~45 mins)
- [ ] **Phase 1e:** Medieval & Modern (~45 mins)
- [ ] **Phase 1f:** 20th Century (~60 mins)
- [ ] **Phase 1g:** Historical Figures (~30 mins)
- [ ] Commit & push

### Day 3: STEM
- [ ] **Phase 2a:** Physics (~60 mins)
- [ ] **Phase 2b:** Chemistry (~45 mins)
- [ ] **Phase 2c:** Biology (~60 mins)
- [ ] **Phase 2d:** Space & Astronomy (~45 mins)
- [ ] Commit & push

### Day 4: Geography & Sports
- [ ] **Phase 3a:** Countries & Capitals (~60 mins)
- [ ] **Phase 3b:** Physical Geography (~45 mins)
- [ ] **Phase 3c:** World Landmarks (~30 mins)
- [ ] **Phase 4a:** Cricket Basics (~30 mins)
- [ ] **Phase 4b:** Football & Olympics (~30 mins)
- [ ] Commit & push

### Day 5-6: TV Shows
- [ ] **Phase 5a:** Animated Shows (~2 hrs)
- [ ] **Phase 5b:** Drama Shows (~2 hrs)
- [ ] **Phase 5c:** Comedy Shows (~1.5 hrs)
- [ ] **Phase 5d:** More Sitcoms (~1.5 hrs)
- [ ] **Phase 5e:** Dramas & Thrillers (~1.5 hrs)
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
| Phase 1 | History | 70K |
| Phase 2 | STEM | 51K |
| Phase 3 | Geography | 27K |
| Phase 4 | Sports | 12K |
| Phase 5 | TV Shows | 62K |
| **New** | | **222K** |
| **Existing** | | **170K** |
| **TOTAL** | | **~392K** |

To reach 500K, we can:
- Add more TV shows
- Deepen any category
- Add gaming wikis (Pokémon, Zelda, etc.)

---

_Last updated: January 2026_
