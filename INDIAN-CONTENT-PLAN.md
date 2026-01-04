# Indian Content Download Plan (KBC Edition)

**Goal:** Create a comprehensive Indian quiz question database inspired by Kaun Banega Crorepati

**Target:** ~1,600 source articles → ~70,000 KBC-style questions

**Last Updated:** January 2025

---

## Quick Summary

| Priority | Category | Sources | Est. Questions |
|----------|----------|---------|----------------|
| 1 | IPL (18 seasons) | 18 | 9,000 |
| 2 | Bollywood Songs | 500 | 10,000 |
| 3 | Bollywood Movies | 200 | 6,000 |
| 4 | Indian Food & Spices | 200 | 5,000 |
| 5 | Indian Web Series | 30 | 4,000 |
| 6 | Bigg Boss | 20 | 8,000 |
| 7 | Indian Elections | 100 | 5,000 |
| 8 | Filmfare Awards | 70 | 4,000 |
| 9 | Freedom Movement | 100 | 3,000 |
| 10 | Geography | 150 | 4,500 |
| 11 | Indian Idol | 14 | 3,000 |
| 12 | KBC Meta | 15 | 2,000 |
| 13 | Constitution & Polity | 50 | 1,500 |
| 14 | Science & Space | 50 | 1,500 |
| 15 | Other Sports | 100 | 3,000 |
| | **TOTAL** | **~1,617** | **~69,500** |

---

## Scraping Strategy

### Approach: One Chunk at a Time
- Scrape ONE season/decade/batch at a time
- Verify data quality before moving to next
- Generate questions immediately after each chunk
- Mark checkbox `[x]` when done, update Progress Tracker

### Phase 1: Mass Appeal Content (Start Here)

**1.1 IPL** (18 chunks - 1 per season)
```
IPL 2008 → IPL 2009 → IPL 2010 → ... → IPL 2025
```

**1.2 Bollywood Songs** (8 chunks - 1 per decade)
```
1950s → 1960s → 1970s → 1980s → 1990s → 2000s → 2010s → 2020s
```

**1.3 Bollywood Movies** (7 chunks - 1 per era)
```
Golden Era → 70s → 80s → 90s → 2000s → 2010s → 2020s
```

**1.4 Indian Food** (5 chunks)
```
Spices → North India dishes → South India dishes → Street Food → Sweets
```

### Phase 2: Entertainment & Pop Culture

**2.1 Indian Web Series** (3 chunks by tier)
```
Tier 1 (big hits) → Tier 2 (popular) → Tier 3 (notable)
```

**2.2 Bigg Boss** (4 chunks - ~5 seasons each)
```
Seasons 1-5 → Seasons 6-10 → Seasons 11-15 → Seasons 16-17 + OTT
```

**2.3 Filmfare Awards** (8 chunks - 1 per decade)
```
1954-59 → 1960s → 1970s → 1980s → 1990s → 2000s → 2010s → 2020s
```

**2.4 Indian Idol** (3 chunks)
```
Seasons 1-5 → Seasons 6-10 → Seasons 11-15
```

### Phase 3: Classic GK

**3.1 Elections** (4 chunks)
```
Elections 1951-1977 → Elections 1980-1999 → Elections 2004-2024 → Political parties & events
```

**3.2 Freedom Movement** (4 chunks)
```
Freedom fighters → Movements & events → Revolutionary orgs → Documents
```

**3.3 Geography** (5 chunks)
```
States & UTs → Rivers → Mountains & Parks → UNESCO sites → Cities
```

### Phase 4: Niche Content

**4.1 KBC Meta** (2 chunks)
```
Seasons 1-8 → Seasons 9-15
```

**4.2 Science & Space** (3 chunks)
```
ISRO missions → Indian scientists → Research institutions
```

**4.3 Other Sports** (3 chunks)
```
Cricket legends → Olympics & Hockey → Other sports
```

---

## Question Generation Guidelines

### Difficulty Distribution
- **Easy (40%):** Widely known facts, recent events, popular culture
- **Medium (40%):** Requires some knowledge, contextual understanding
- **Hard (20%):** Deep knowledge, specific details, historical facts

### Question Types by Category

| Category | Sample Question Types |
|----------|----------------------|
| IPL | "Who won Orange Cap in IPL 2023?", "Which team has won most IPL titles?" |
| Bollywood Songs | "Which movie features the song 'Chaiyya Chaiyya'?", "Who composed music for Lagaan?" |
| Bollywood Movies | "Who directed Sholay?", "Which film won Best Film at Filmfare 1995?" |
| Food & Spices | "What is Haldi called in English?", "Litti Chokha is famous in which state?" |
| Web Series | "Who plays Kaleen Bhaiya in Mirzapur?", "Panchayat is set in which state?" |
| Bigg Boss | "Who won Bigg Boss Season 13?", "Which season had Sidharth Shukla?" |
| Elections | "Who was India's first woman PM?", "In which year was Emergency declared?" |
| Geography | "Which river is called Dakshina Ganga?", "Kaziranga is famous for which animal?" |

### Quality Rules
- All answers must be verifiable from source content
- Avoid ambiguous questions with multiple valid answers
- No trick questions or misleading wording
- Keep language simple and clear
- Prefer conceptual understanding over rote memorization

---

## Section 0: Brain Rot Goldmines

### 0.1 Bigg Boss Hindi (17 Seasons)

**Target:** 20 articles | **Est. Questions:** 8,000+

#### Season Data
- [ ] Bigg Boss Season 1 (2006) - Rahul Roy wins
- [ ] Bigg Boss Season 2 (2008) - Ashutosh Kaushik wins
- [ ] Bigg Boss Season 3 (2009) - Vindu Dara Singh wins
- [ ] Bigg Boss Season 4 (2010) - Shweta Tiwari wins
- [ ] Bigg Boss Season 5 (2011) - Juhi Parmar wins
- [ ] Bigg Boss Season 6 (2012) - Urvashi Dholakia wins
- [ ] Bigg Boss Season 7 (2013) - Gauahar Khan wins
- [ ] Bigg Boss Season 8 (2014) - Gautam Gulati wins
- [ ] Bigg Boss Season 9 (2015) - Prince Narula wins
- [ ] Bigg Boss Season 10 (2016) - Manveer Gurjar wins
- [ ] Bigg Boss Season 11 (2017) - Shilpa Shinde wins
- [ ] Bigg Boss Season 12 (2018) - Dipika Kakar wins
- [ ] Bigg Boss Season 13 (2019) - Sidharth Shukla wins
- [ ] Bigg Boss Season 14 (2020) - Rubina Dilaik wins
- [ ] Bigg Boss Season 15 (2021) - Tejasswi Prakash wins
- [ ] Bigg Boss Season 16 (2022) - MC Stan wins
- [ ] Bigg Boss Season 17 (2023) - Munawar Faruqui wins

#### Data to Capture Per Season
- Winner, Runner-up, Top 5 finalists
- Complete contestant list with professions
- Week-by-week eviction order
- Major controversies and fights
- Wild card entries
- Weekend Ka Vaar celebrity guests
- Memorable tasks and moments

#### Bigg Boss OTT
- [ ] OTT Season 1 (2021) - Divya Agarwal wins
- [ ] OTT Season 2 (2023) - Elvish Yadav wins
- [ ] OTT Season 3 (2024) - Sana Makbul wins

---

### 0.2 Indian Elections & Politics

**Target:** 100 articles | **Est. Questions:** 5,000+

#### Lok Sabha Elections (All 18)
- [ ] 1951-52 (1st General Election)
- [ ] 1957, 1962, 1967
- [ ] 1971 (Indira wave)
- [ ] 1977 (Post-Emergency)
- [ ] 1980, 1984 (Sympathy wave)
- [ ] 1989, 1991
- [ ] 1996, 1998, 1999
- [ ] 2004 (India Shining fails)
- [ ] 2009
- [ ] 2014 (Modi wave)
- [ ] 2019, 2024

#### Political Leaders
- [ ] Jawaharlal Nehru
- [ ] Indira Gandhi
- [ ] Rajiv Gandhi
- [ ] Atal Bihari Vajpayee
- [ ] Manmohan Singh
- [ ] Narendra Modi
- [ ] Other PMs and key figures

#### Political Parties
- [ ] INC, BJP, CPI(M)
- [ ] Regional parties: TMC, SP, BSP, AAP
- [ ] South: DMK, AIADMK
- [ ] Others: Shiv Sena, NCP, JD(U), RJD

#### Major Political Events
- [ ] Emergency (1975-77)
- [ ] Operation Blue Star
- [ ] Babri Masjid demolition
- [ ] Anna Hazare movement
- [ ] Demonetization (2016)
- [ ] Farm laws protest

---

### 0.3 Filmfare Awards (70 Years)

**Target:** 70 ceremonies | **Est. Questions:** 4,000+

#### By Decade
- [ ] 1954-1959 (Early years)
- [ ] 1960-1969
- [ ] 1970-1979
- [ ] 1980-1989
- [ ] 1990-1999
- [ ] 2000-2009
- [ ] 2010-2019
- [ ] 2020-2024

#### Categories to Track
- Best Film, Director, Actor, Actress (every year)
- Best Supporting Actor/Actress
- Best Music Director
- Best Playback Singer (Male/Female)
- Best Debut, Lifetime Achievement

---

### 0.4 Indian Idol (14 Seasons)

**Target:** 14 seasons | **Est. Questions:** 3,000+

- [ ] Season 1 (2004) - Abhijeet Sawant
- [ ] Season 2 (2005) - Sandeep Acharya
- [ ] Season 3 (2007) - Prashant Tamang
- [ ] Season 4-6 (2008-2012)
- [ ] Season 7-10 (2016-2018)
- [ ] Season 11-15 (2019-2024)

---

### 0.5 KBC Meta (15 Seasons)

**Target:** 15 seasons | **Est. Questions:** 2,000+

- [ ] All Crorepati winners with their winning questions
- [ ] 7 Crore winners (very rare!)
- [ ] Jackpot questions that stumped contestants
- [ ] Celebrity special episodes
- [ ] Format changes over the years
- [ ] Famous Amitabh dialogues

---

### 0.6 Indian Web Series

**Target:** 30+ series | **Est. Questions:** 4,000+

#### Tier 1 - Must Have
- [ ] Mirzapur (Seasons 1-3)
- [ ] Sacred Games (Seasons 1-2)
- [ ] The Family Man (Seasons 1-2)
- [ ] Panchayat (Seasons 1-3)
- [ ] Scam 1992: The Harshad Mehta Story
- [ ] Kota Factory (Seasons 1-2)
- [ ] Paatal Lok
- [ ] Delhi Crime (Seasons 1-2)

#### Tier 2 - Popular
- [ ] TVF Aspirants, Gullak, Made in Heaven
- [ ] Asur, Farzi, Rocket Boys, Jubilee
- [ ] Breathe, Inside Edge, Hostel Daze

#### Tier 3 - Notable
- [ ] Special Ops, Aarya, Criminal Justice
- [ ] TVF shows: Pitchers, Permanent Roommates, Tripling

#### Data to Capture
- Main cast and characters
- Plot summaries (no spoilers in questions)
- Iconic dialogues
- Filming locations
- Awards won

---

### 0.7 Indian Food & Spices

**Target:** 200 articles | **Est. Questions:** 5,000+

#### Spices (Hindi-English)
- [ ] Haldi (Turmeric), Jeera (Cumin), Dhaniya (Coriander)
- [ ] Elaichi (Cardamom), Laung (Cloves), Dalchini (Cinnamon)
- [ ] Hing (Asafoetida), Kesar (Saffron), Ajwain (Carom)
- [ ] All 25+ common Indian spices with translations

#### State-wise Famous Dishes (All 28 States + UTs)
- [ ] Bihar: Litti Chokha, Sattu
- [ ] Punjab: Makki di Roti, Sarson da Saag
- [ ] Gujarat: Dhokla, Fafda, Thepla
- [ ] Bengal: Rosogolla, Mishti Doi, Machher Jhol
- [ ] Kerala: Appam, Sadya, Fish Curry
- [ ] Tamil Nadu: Dosa, Idli, Chettinad
- [ ] And all other states...

#### Street Food by City
- [ ] Mumbai: Vada Pav, Pav Bhaji
- [ ] Delhi: Chole Bhature, Paranthe Wali Gali
- [ ] Kolkata: Kathi Roll, Phuchka
- [ ] Lucknow: Tunday Kebab
- [ ] Indore: Poha Jalebi (Street food capital!)

#### Indian Sweets (Mithai)
- [ ] Gulab Jamun, Rasgulla, Jalebi
- [ ] Ladoo varieties, Barfi varieties
- [ ] Regional: Mysore Pak, Ghewar, Sandesh

#### Beverages
- [ ] Masala Chai, Lassi, Filter Coffee
- [ ] Thandai, Jaljeera, Aam Panna

---

## Section 1: Bollywood Songs

**Target:** 500 songs | **Est. Questions:** 10,000

### 1.1 Songs by Decade
- [ ] 1950s classics (50 songs)
- [ ] 1960s classics (50 songs)
- [ ] 1970s classics (50 songs)
- [ ] 1980s hits (50 songs)
- [ ] 1990s romantic era (50 songs)
- [ ] 2000s (50 songs)
- [ ] 2010s (50 songs)
- [ ] 2020s (30 songs)

### 1.2 Music Directors
- [ ] Shankar-Jaikishan, Laxmikant-Pyarelal
- [ ] R.D. Burman (have), Nadeem-Shravan
- [ ] Pritam, Vishal-Shekhar, A.R. Rahman (have)

### 1.3 Playback Singers
- [ ] Lata Mangeshkar (have), Mohammed Rafi (have)
- [ ] Kishore Kumar (have), Asha Bhosle (have)
- [ ] Kumar Sanu, Udit Narayan, Alka Yagnik
- [ ] Arijit Singh (have), Shreya Ghoshal, Sonu Nigam

### 1.4 Lyricists
- [ ] Sahir Ludhianvi, Gulzar, Javed Akhtar
- [ ] Anand Bakshi, Sameer, Prasoon Joshi

---

## Section 2: Bollywood Movies

**Target:** 200 films | **Est. Questions:** 6,000
**Currently Have:** 46 articles

### 2.1 Golden Era (1950-1969)
- [ ] Awaara, Pyaasa, Guide, Mughal-e-Azam (have)

### 2.2 70s Classics
- [ ] Sholay (have), Deewar, Amar Akbar Anthony, Don

### 2.3 80s Masala
- [ ] Mr. India, Tezaab, QSQT, Maine Pyar Kiya

### 2.4 90s Romance
- [ ] DDLJ (have), HAHK, KKHH, Dil To Pagal Hai

### 2.5 2000s
- [ ] Lagaan (have), DCH (have), 3 Idiots (have)
- [ ] Rang De Basanti, Chak De, Taare Zameen Par

### 2.6 2010s
- [ ] PK (have), Dangal, Andhadhun, Gully Boy

### 2.7 2020s
- [ ] RRR, Pathaan, Jawan, 12th Fail

---

## Section 3: Freedom Movement

**Target:** 100 articles | **Est. Questions:** 3,000
**Currently Have:** ~20 articles

### 3.1 Freedom Fighters
- [ ] Bhagat Singh, Chandrashekhar Azad, Subhas Chandra Bose
- [ ] Rani Lakshmibai, Mangal Pandey, Tantia Tope
- [ ] Gandhi (have), Nehru, Patel, Tilak

### 3.2 Movements & Events
- [ ] Swadeshi, Non-Cooperation (have), Civil Disobedience
- [ ] Salt March, Quit India, Khilafat
- [ ] Jallianwala Bagh (have), Chauri Chaura

### 3.3 Revolutionary Organizations
- [ ] Ghadar Party, HSRA, INA, Azad Hind

---

## Section 4: Indian Geography

**Target:** 150 articles | **Est. Questions:** 4,500

### 4.1 States & UTs
- [ ] All 28 states with capitals, formation dates
- [ ] All 8 Union Territories

### 4.2 Physical Features
- [ ] Rivers: Ganga, Brahmaputra, Godavari, Krishna, Narmada
- [ ] Mountains: Himalayas, Western Ghats, Aravalli

### 4.3 National Parks & Wildlife
- [ ] Jim Corbett, Kaziranga, Ranthambore, Gir, Sundarbans

### 4.4 UNESCO World Heritage Sites
- [ ] Taj Mahal, Red Fort, Qutub Minar
- [ ] Ajanta (have), Ellora, Hampi, Khajuraho (have)

---

## Section 5: Indian Sports

**Target:** 250 articles | **Est. Questions:** 12,000+

### 5.0 IPL (The Big One)

**Target:** 18 seasons | **Est. Questions:** 9,000+

#### All Seasons
- [ ] 2008: Rajasthan Royals (Shane Warne magic)
- [ ] 2009: Deccan Chargers (South Africa edition)
- [ ] 2010-2011: Chennai Super Kings dominance
- [ ] 2012: Kolkata Knight Riders
- [ ] 2013-2015: Mumbai Indians rise
- [ ] 2016: Sunrisers Hyderabad
- [ ] 2017-2020: Mumbai Indians dynasty
- [ ] 2021: Chennai Super Kings comeback
- [ ] 2022: Gujarat Titans (10-team era begins)
- [ ] 2023: Chennai Super Kings
- [ ] 2024: Kolkata Knight Riders
- [ ] 2025: Current season

#### Teams (Current + Defunct)
- [ ] MI, CSK, KKR, RCB, RR, SRH, DC, PBKS, GT, LSG
- [ ] Defunct: Deccan Chargers, Pune Warriors, RPS, GL

#### Records & Awards
- [ ] Orange Cap winners (all seasons)
- [ ] Purple Cap winners (all seasons)
- [ ] All-time records: runs, wickets, sixes, catches
- [ ] Auction history and record buys

### 5.1 Cricket Legends
- [ ] Sachin, Dhoni, Kohli, Kapil Dev, Gavaskar, Dravid

### 5.2 Cricket Moments
- [ ] 1983 World Cup, 2007 T20 WC, 2011 World Cup

### 5.3 Olympic Medalists
- [ ] Neeraj Chopra, PV Sindhu, Mary Kom, Abhinav Bindra

### 5.4 Hockey
- [ ] Dhyan Chand, Olympic golds history

### 5.5 Other Sports
- [ ] Viswanathan Anand, Milkha Singh, PT Usha

---

## Section 6: Constitution & Polity

**Target:** 50 articles | **Est. Questions:** 1,500

- [ ] Constitution basics: Preamble, Fundamental Rights, DPSP
- [ ] Constitutional bodies: EC, CAG, UPSC
- [ ] Lists of Presidents, PMs, CJIs
- [ ] B.R. Ambedkar and Constitution making

---

## Section 7: Indian Science & Space

**Target:** 50 articles | **Est. Questions:** 1,500

### 7.1 ISRO Missions
- [ ] Chandrayaan 1, 2, 3
- [ ] Mangalyaan (Mars Orbiter)
- [ ] Gaganyaan, Aditya-L1

### 7.2 Indian Scientists
- [ ] C.V. Raman, APJ Kalam, Homi Bhabha
- [ ] Vikram Sarabhai, Ramanujan

### 7.3 Research Institutions
- [ ] ISRO, DRDO, BARC, IITs, IISc

---

## Progress Tracker

### Phase 1: Mass Appeal

#### 1.1 IPL (18 seasons)
| Season | Scraped | Questions Generated | Status |
|--------|---------|---------------------|--------|
| IPL 2008 | [ ] | [ ] | |
| IPL 2009 | [ ] | [ ] | |
| IPL 2010 | [ ] | [ ] | |
| IPL 2011 | [ ] | [ ] | |
| IPL 2012 | [ ] | [ ] | |
| IPL 2013 | [ ] | [ ] | |
| IPL 2014 | [ ] | [ ] | |
| IPL 2015 | [ ] | [ ] | |
| IPL 2016 | [ ] | [ ] | |
| IPL 2017 | [ ] | [ ] | |
| IPL 2018 | [ ] | [ ] | |
| IPL 2019 | [ ] | [ ] | |
| IPL 2020 | [ ] | [ ] | |
| IPL 2021 | [ ] | [ ] | |
| IPL 2022 | [ ] | [ ] | |
| IPL 2023 | [ ] | [ ] | |
| IPL 2024 | [ ] | [ ] | |
| IPL 2025 | [ ] | [ ] | |

#### 1.2 Bollywood Songs (8 decades)
| Decade | Scraped | Questions Generated | Status |
|--------|---------|---------------------|--------|
| 1950s | [ ] | [ ] | |
| 1960s | [ ] | [ ] | |
| 1970s | [ ] | [ ] | |
| 1980s | [ ] | [ ] | |
| 1990s | [ ] | [ ] | |
| 2000s | [ ] | [ ] | |
| 2010s | [ ] | [ ] | |
| 2020s | [ ] | [ ] | |

#### 1.3 Bollywood Movies (7 eras)
| Era | Scraped | Questions Generated | Status |
|-----|---------|---------------------|--------|
| Golden Era (1950-69) | [ ] | [ ] | |
| 70s Classics | [ ] | [ ] | |
| 80s Masala | [ ] | [ ] | |
| 90s Romance | [ ] | [ ] | |
| 2000s | [ ] | [ ] | |
| 2010s | [ ] | [ ] | |
| 2020s | [ ] | [ ] | |

#### 1.4 Indian Food (5 chunks)
| Chunk | Scraped | Questions Generated | Status |
|-------|---------|---------------------|--------|
| Spices (Hindi-English) | [ ] | [ ] | |
| North India Dishes | [ ] | [ ] | |
| South India Dishes | [ ] | [ ] | |
| Street Food by City | [ ] | [ ] | |
| Sweets & Beverages | [ ] | [ ] | |

---

### Phase 2: Entertainment

#### 2.1 Web Series (3 tiers)
| Tier | Scraped | Questions Generated | Status |
|------|---------|---------------------|--------|
| Tier 1 (Mirzapur, Sacred Games, etc.) | [ ] | [ ] | |
| Tier 2 (Aspirants, Gullak, etc.) | [ ] | [ ] | |
| Tier 3 (TVF shows, etc.) | [ ] | [ ] | |

#### 2.2 Bigg Boss (4 batches)
| Batch | Scraped | Questions Generated | Status |
|-------|---------|---------------------|--------|
| Seasons 1-5 (2006-2011) | [ ] | [ ] | |
| Seasons 6-10 (2012-2016) | [ ] | [ ] | |
| Seasons 11-15 (2017-2021) | [ ] | [ ] | |
| Seasons 16-17 + OTT | [ ] | [ ] | |

#### 2.3 Filmfare Awards (8 decades)
| Decade | Scraped | Questions Generated | Status |
|--------|---------|---------------------|--------|
| 1954-1959 | [ ] | [ ] | |
| 1960s | [ ] | [ ] | |
| 1970s | [ ] | [ ] | |
| 1980s | [ ] | [ ] | |
| 1990s | [ ] | [ ] | |
| 2000s | [ ] | [ ] | |
| 2010s | [ ] | [ ] | |
| 2020s | [ ] | [ ] | |

#### 2.4 Indian Idol (3 batches)
| Batch | Scraped | Questions Generated | Status |
|-------|---------|---------------------|--------|
| Seasons 1-5 | [ ] | [ ] | |
| Seasons 6-10 | [ ] | [ ] | |
| Seasons 11-15 | [ ] | [ ] | |

---

### Phase 3: Classic GK

#### 3.1 Elections (4 chunks)
| Chunk | Scraped | Questions Generated | Status |
|-------|---------|---------------------|--------|
| Elections 1951-1977 | [ ] | [ ] | |
| Elections 1980-1999 | [ ] | [ ] | |
| Elections 2004-2024 | [ ] | [ ] | |
| Political Parties & Events | [ ] | [ ] | |

#### 3.2 Freedom Movement (4 chunks)
| Chunk | Scraped | Questions Generated | Status |
|-------|---------|---------------------|--------|
| Freedom Fighters | [ ] | [ ] | |
| Movements & Events | [ ] | [ ] | |
| Revolutionary Orgs | [ ] | [ ] | |
| Documents & Declarations | [ ] | [ ] | |

#### 3.3 Geography (5 chunks)
| Chunk | Scraped | Questions Generated | Status |
|-------|---------|---------------------|--------|
| States & UTs | [ ] | [ ] | |
| Rivers | [ ] | [ ] | |
| Mountains & National Parks | [ ] | [ ] | |
| UNESCO World Heritage Sites | [ ] | [ ] | |
| Major Cities | [ ] | [ ] | |

#### 3.4 Constitution & Polity (3 chunks)
| Chunk | Scraped | Questions Generated | Status |
|-------|---------|---------------------|--------|
| Constitution Basics | [ ] | [ ] | |
| Constitutional Bodies | [ ] | [ ] | |
| Leaders (Presidents, PMs, CJIs) | [ ] | [ ] | |

---

### Phase 4: Niche

#### 4.1 KBC Meta (2 batches)
| Batch | Scraped | Questions Generated | Status |
|-------|---------|---------------------|--------|
| Seasons 1-8 | [ ] | [ ] | |
| Seasons 9-15 | [ ] | [ ] | |

#### 4.2 Science & Space (3 chunks)
| Chunk | Scraped | Questions Generated | Status |
|-------|---------|---------------------|--------|
| ISRO Missions | [ ] | [ ] | |
| Indian Scientists | [ ] | [ ] | |
| Research Institutions | [ ] | [ ] | |

#### 4.3 Other Sports (3 chunks)
| Chunk | Scraped | Questions Generated | Status |
|-------|---------|---------------------|--------|
| Cricket Legends & Moments | [ ] | [ ] | |
| Olympics & Hockey | [ ] | [ ] | |
| Other Sports (Chess, Athletics, etc.) | [ ] | [ ] | |

---

### Overall Progress

| Phase | Total Chunks | Completed | % |
|-------|--------------|-----------|---|
| Phase 1: Mass Appeal | 38 | 0 | 0% |
| Phase 2: Entertainment | 18 | 0 | 0% |
| Phase 3: Classic GK | 16 | 0 | 0% |
| Phase 4: Niche | 8 | 0 | 0% |
| **TOTAL** | **80 chunks** | **0** | **0%** |

---

## Data Sources

| Category | Primary Source | Backup Source |
|----------|---------------|---------------|
| IPL | Wikipedia + ESPNcricinfo | IPL official |
| Bollywood | Wikipedia | Bollywood Hungama |
| Bigg Boss | Wikipedia | Fan wikis |
| Elections | Wikipedia + ECI | News archives |
| Food | Wikipedia | Regional food blogs |
| Web Series | Wikipedia + IMDb | OTT platforms |
| Geography | Wikipedia | Government sites |
| Science | Wikipedia + ISRO | Research papers |

---

## Notes

- Mark items with `[x]` when downloaded
- Mark items with `(have)` if already in database
- Each section can be scraped independently
- Update Progress Tracker after each batch
- Prioritize Phase 1 content for v1 launch

---

## Sample Questions (For Reference)

**IPL:**
- "Which team won the first IPL in 2008?" → Rajasthan Royals
- "Who holds the record for most runs in IPL history?" → Virat Kohli

**Bollywood Songs:**
- "Which movie features the song 'Chaiyya Chaiyya'?" → Dil Se
- "Who composed the music for 'Sholay'?" → R.D. Burman

**Food:**
- "What is 'Hing' called in English?" → Asafoetida
- "Litti Chokha is the famous dish of which state?" → Bihar

**Web Series:**
- "Who plays Kaleen Bhaiya in Mirzapur?" → Pankaj Tripathi
- "Panchayat is set in which fictional village?" → Phulera

**Elections:**
- "Who was India's first woman Prime Minister?" → Indira Gandhi
- "In which year was the Emergency declared in India?" → 1975

**Geography:**
- "Which national park is famous for one-horned rhinoceros?" → Kaziranga
- "The Godavari river originates in which state?" → Maharashtra
