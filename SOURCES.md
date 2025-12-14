# Question Sources Documentation

This document lists all the researched sources for scraping content and generating quiz questions.

---

## TV Shows & Movies Transcripts

### Best Transcript Sources (Priority Order)

#### 1. **Subslikescript** ⭐ TOP CHOICE
- **URL**: https://subslikescript.com
- **Coverage**: TV shows (Friends, Big Bang Theory, How I Met Your Mother, etc.) + Movies
- **Format**: Clean HTML with full episode transcripts
- **Update Frequency**: Active and regularly updated
- **Scraping Difficulty**: Easy
- **Example**: https://subslikescript.com/series/The_Big_Bang_Theory-898266

#### 2. **Forever Dreaming**
- **URL**: https://transcripts.foreverdreaming.org
- **Coverage**: Comprehensive TV show transcripts
- **Format**: Forum-based with episode threads
- **Update Frequency**: Active community
- **Scraping Difficulty**: Medium
- **Example**: https://transcripts.foreverdreaming.org/viewforum.php?f=159

#### 3. **TvT - TV Show Transcripts**
- **URL**: https://tvshowtranscripts.ourboard.org
- **Coverage**: Wide range of TV shows
- **Format**: Board/forum format
- **Update Frequency**: Regular updates through 2025
- **Scraping Difficulty**: Medium

#### 4. **SimplyScripts** (Movies)
- **URL**: https://www.simplyscripts.com/movie-scripts.html
- **Coverage**: Movie scripts and screenplays
- **Format**: PDF and text downloads
- **Scraping Difficulty**: Easy

#### 5. **IMSDb - Internet Movie Script Database** (Movies)
- **URL**: https://imsdb.com
- **Coverage**: Extensive movie screenplay collection
- **Format**: HTML pages
- **Scraping Difficulty**: Easy

#### 6. **Script Slug** (Movies)
- **URL**: https://www.scriptslug.com
- **Coverage**: Movie scripts from various genres
- **Format**: PDF downloads
- **Scraping Difficulty**: Medium

---

## Cricket Data

### Cricket APIs & Sources

#### 1. **CricAPI (CricketData.org)** ⭐ RECOMMENDED
- **URL**: https://www.cricapi.com
- **Type**: Free API
- **Rate Limit**: 100,000 hits/hour (generous)
- **Coverage**: Live scores, player stats, ball-by-ball data
- **Formats**: All (Test, ODI, T20, IPL)
- **API Key**: Required (free)
- **Data Quality**: High

#### 2. **GitHub - sanwebinfo/cricket-api**
- **URL**: https://github.com/sanwebinfo/cricket-api
- **Type**: Open-source scraper
- **Method**: BeautifulSoup + Flask JSON API
- **Coverage**: Live scores, realtime data
- **Deployment**: Self-hosted (free server shutdown, requires hosting)
- **Use Case**: Good for learning, requires setup

#### 3. **Unofficial Cricbuzz API**
- **URL**: https://github.com/ekamid/cricbuzz-live
- **Type**: Web scraper
- **Method**: Scrapes Cricbuzz.com
- **Coverage**: Live matches, scores
- **Legal**: Unofficial, use cautiously

#### 4. **ESPNcricinfo Statsguru** (Web Scraping)
- **URL**: https://stats.espncricinfo.com/ci/engine/stats/index.html
- **Type**: Web scraping target
- **Coverage**: Comprehensive historical stats, records
- **Method**: HTML parsing
- **Data Quality**: Excellent
- **Note**: No official API, requires scraping

#### 5. **RapidAPI Cricket APIs**
- **URL**: https://rapidapi.com/collection/cricket-api
- **Type**: Commercial API (has free tier)
- **Coverage**: Live scores, fixtures, player stats
- **Rate Limit**: Varies by tier

---

## Current Affairs / News

### News APIs & RSS Feeds

#### 1. **NewsAPI** ⭐ POPULAR CHOICE
- **URL**: https://newsapi.org
- **Type**: Free tier available
- **Coverage**: 80,000+ sources, 55 countries, 14 languages
- **Categories**: Politics, Technology, Business, Sports, etc.
- **API Key**: Required
- **Free Tier**: 100 requests/day
- **Data Quality**: Excellent

#### 2. **NewsData.io**
- **URL**: https://newsdata.io
- **Type**: Free & paid tiers
- **Coverage**: Real-time and historical news
- **Features**: Advanced filtering, categorization
- **API Key**: Required
- **Free Tier**: Available

#### 3. **Mediastack**
- **URL**: https://mediastack.com
- **Coverage**: 7,500+ sources, 50+ countries, 13 languages
- **Type**: Commercial with free tier
- **API Key**: Required

#### 4. **Google News RSS**
- **URL**: https://news.google.com/rss
- **Type**: Free RSS feeds
- **Coverage**: All categories, customizable
- **Method**: RSS parsing
- **Rate Limit**: None (respectful scraping)

#### 5. **BBC News RSS**
- **URL**: http://feeds.bbci.co.uk/news/rss.xml
- **Type**: Free RSS feed
- **Coverage**: UK & World news
- **Quality**: High journalistic standards

#### 6. **Reuters RSS**
- **URL**: https://www.reutersagency.com/feed/
- **Type**: Free RSS feed
- **Coverage**: Global news, business, technology

---

## Science

### Science Data Sources

#### 1. **NASA Open APIs** ⭐ EXCELLENT FOR SPACE
- **URL**: https://api.nasa.gov
- **Type**: Free API (requires key)
- **Rate Limit**: 1000 requests/hour with API key
- **Coverage**:
  - Astronomy Picture of the Day (APOD)
  - Mars Rover Photos
  - Earth Imagery (EPIC)
  - Near Earth Objects
  - Asteroids
- **Data Quality**: Official, accurate
- **Educational Use**: Excellent

#### 2. **Wikipedia API**
- **URL**: https://en.wikipedia.org/w/api.php
- **Type**: Free API
- **Coverage**: All science topics
- **Method**: MediaWiki API
- **Categories**: Physics, Chemistry, Biology, Mathematics
- **Rate Limit**: Respectful use required

#### 3. **Science Daily**
- **URL**: https://www.sciencedaily.com
- **Type**: Web scraping
- **Coverage**: Latest science news and discoveries
- **Method**: HTML parsing
- **Topics**: All science disciplines

#### 4. **ArXiv API** (Advanced Science)
- **URL**: https://arxiv.org/help/api
- **Type**: Free API
- **Coverage**: Scientific papers (Physics, Math, CS, etc.)
- **Use Case**: Advanced questions

#### 5. **PubChem** (Chemistry)
- **URL**: https://pubchem.ncbi.nlm.nih.gov
- **Type**: Free API
- **Coverage**: Chemical compounds, molecules
- **Use Case**: Chemistry questions

---

## Custom Resources

### User-Provided Content
- **Method**: File upload (PDF, TXT, DOCX, URLs)
- **Processing**: Groq AI for question generation
- **Flexibility**: Any topic the user provides
- **Examples**:
  - PDFs of study materials
  - Wikipedia articles
  - Custom text documents
  - YouTube transcript URLs

---

## Groq AI Integration

### Question Generation
- **Provider**: Groq
- **Model**: `mixtral-8x7b-32768` (recommended)
- **Alternative Models**:
  - `llama-3.1-70b-versatile`
  - `gemma2-9b-it`
- **API Key**: Required (get from https://console.groq.com)
- **Rate Limit**: Generous free tier
- **Use Cases**:
  - Generate MCQs from transcripts
  - Create questions from news articles
  - Generate science trivia
  - Custom resource question generation

---

## Rate Limiting & Ethics

### Best Practices
1. **Delay between requests**: 2 seconds minimum
2. **Respectful User-Agent**: Identify as educational bot
3. **Cache everything**: Avoid redundant requests
4. **Respect robots.txt**: Check site policies
5. **API keys**: Use official APIs when available
6. **Terms of Service**: Review before scraping

### Recommended Scraping Tools
- **HTTP Client**: Axios (already installed)
- **HTML Parser**: Cheerio
- **Rate Limiter**: p-limit or bottleneck
- **Cache**: Node-cache or file-based caching

---

## Sources & References

### TV Shows/Movies Research
- [Subslikescript - Big Bang Theory](https://subslikescript.com/series/The_Big_Bang_Theory-898266)
- [Forever Dreaming Transcripts](https://transcripts.foreverdreaming.org)
- [IMSDb - Movie Scripts](https://imsdb.com)
- [SimplyScripts](https://www.simplyscripts.com)

### Cricket Research
- [CricAPI Official](https://www.cricapi.com)
- [Cricket API GitHub](https://github.com/sanwebinfo/cricket-api)
- [ESPNcricinfo Statsguru](https://stats.espncricinfo.com)

### News/Current Affairs Research
- [NewsAPI](https://newsapi.org)
- [NewsData.io](https://newsdata.io)
- [Best News APIs 2025](https://webz.io/blog/news-api/best-news-apis-list/)

### Science Research
- [NASA Open APIs](https://api.nasa.gov)
- [NASA API Guide](https://wilsjame.github.io/how-to-nasa/)
- [Wikipedia API Documentation](https://www.mediawiki.org/wiki/API:Main_page)

---

**Last Updated**: 2025-12-14
**Next Review**: When adding new genres or sources
