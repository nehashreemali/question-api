# Question Generation Ruleset

**Purpose:** Define exact rules and procedures for generating consistent, high-quality quiz questions from TV show transcripts.

---

## 1. Question Count Rules

### Per Episode Targets

| Episode Runtime | Min Questions | Target Questions | Max Questions |
|-----------------|---------------|------------------|---------------|
| 20-25 min (Sitcom) | 20 | 30 | 40 |
| 40-50 min (Drama) | 30 | 45 | 60 |
| 60+ min (Extended) | 40 | 60 | 80 |

### Dynamic Calculation
```
Target Questions = floor(Word Count / 150)
Min Questions = Target × 0.7
Max Questions = Target × 1.3
```

**Example:**
- Friends episode: 3,000 words → Target: 20, Min: 14, Max: 26
- Breaking Bad episode: 6,000 words → Target: 40, Min: 28, Max: 52

---

## 2. Difficulty Distribution

### Standard Distribution (Default)

| Difficulty | Percentage | Description |
|------------|------------|-------------|
| Easy | 30-40% | Basic plot points, main character actions, obvious events |
| Medium | 40-50% | Specific dialogue, character motivations, scene details |
| Hard | 10-20% | Subtle details, minor characters, background events, specific word choices |

### Episode-Based Adjustment

**For 30 questions:**
- Easy: 9-12 questions
- Medium: 12-15 questions
- Hard: 3-6 questions

**For 45 questions:**
- Easy: 14-18 questions
- Medium: 18-23 questions
- Hard: 5-9 questions

### Difficulty Criteria

**Easy Questions:**
- Main plot events ("What does Chandler reveal to the group?")
- Primary character actions ("Who moves in across the hall?")
- Obvious outcomes ("What is Penny's job?")
- Central dialogue topics
- Episode-defining moments

**Medium Questions:**
- Specific dialogue quotes ("What does Monica say about kissing?")
- Character motivations ("Why does Ross go to the OB/GYN?")
- Scene-specific details ("What is Ross holding at the museum?")
- Secondary character actions
- Cause-and-effect relationships

**Hard Questions:**
- Subtle visual details ("What object does Sheldon mime with?")
- Minor character names ("What is the name of Ross's co-worker?")
- Background dialogue
- Specific word choices in quotes
- Implied meanings and subtext

---

## 3. Question Type Distribution

### Required Types (Per Episode)

| Type | Percentage | Min Count (30Q) | Description |
|------|------------|-----------------|-------------|
| Dialogue | 35-45% | 11-14 | "What does X say about Y?" |
| Scene | 20-30% | 6-9 | "What happens when X?" |
| Character | 15-25% | 5-8 | "Why does X do Y?", "What is X's reaction?" |
| Plot | 10-20% | 3-6 | "What is the outcome of X?", "What is revealed?" |
| Object/Setting | 5-10% | 2-3 | "What object is mentioned?", "Where does X take place?" |

### Type Definitions

**1. Dialogue Questions**
- Direct quote questions ("What does Monica say is 'just some guy I work with'?")
- Paraphrased dialogue ("What does Chandler reveal to the group?")
- Conversation topics ("What do Sheldon and Leonard discuss?")

**2. Scene Questions**
- Action sequences ("What is the outcome of Leonard and Sheldon's visit?")
- Event order ("What happens after Ross leaves the OB/GYN?")
- Scene locations ("Where does the sonogram scene take place?")

**3. Character Questions**
- Motivations ("Why does Penny ask Leonard for help?")
- Reactions ("What is Monica's reaction to the news?")
- Relationships ("What is Ross's relationship with Carol?")
- Emotions ("How does Rachel feel about Barry?")

**4. Plot Questions**
- Story developments ("What news does Carol share with Ross?")
- Revelations ("What is revealed about Chandler's past?")
- Outcomes ("What is the result of the date?")

**5. Object/Setting Questions**
- Props ("What object does Joey eat from?")
- Locations ("What is the name of the museum?")
- Specific items mentioned ("What is Rachel looking for?")

---

## 4. Question Quality Standards

### Mandatory Requirements

✅ **Specificity**
- Questions MUST be specific to THIS episode
- NO general show knowledge questions
- Example BAD: "What is the name of the coffee shop?" (general knowledge)
- Example GOOD: "What does Rachel order at Central Perk in this episode?" (episode-specific)

✅ **Answer Clarity**
- Exactly ONE clearly correct answer
- Other options must be definitively wrong
- No ambiguous or subjective answers
- Answer must be explicitly stated or clearly shown in the episode

✅ **Option Quality**
- Exactly 4 options per question
- All options similar length and structure
- Plausible but wrong distractors
- NO "All of the above" or "None of the above"
- NO obvious joke answers

✅ **Verifiability**
- Answer must be verifiable from transcript
- Quote the relevant dialogue/action in explanation
- Reference specific scene or moment

✅ **No Duplication**
- No repeated questions within an episode
- No similar questions asking the same thing differently
- Check against existing questions before adding

---

## 5. Question Format Standards

### Question Structure

**Format:**
```
[Question Type] + [Specific Detail] + [Context if needed]
```

**Good Examples:**
- "What does Monica say is 'just some guy I work with'?" (Dialogue)
- "Why does Ross go to Carol's OB/GYN appointment?" (Character motivation)
- "What is the outcome of Leonard and Sheldon's visit to Penny's ex-boyfriend?" (Plot)
- "What object does Chandler write a note on?" (Object)

**Bad Examples:**
- "What happens?" (Too vague)
- "Who is Ross?" (General knowledge)
- "What is the name of the show?" (Meta question)
- "What do you think Monica feels?" (Subjective)

### Option Structure

**Requirements:**
- 4 options exactly
- Similar grammatical structure
- Similar length (within 2-3 words)
- Alphabetically or logically ordered when possible
- No obvious patterns (e.g., "C is always correct")

**Good Example:**
```
Question: "What is Penny's job?"
A. Waitress at The Cheesecake Factory ✓
B. Actress in community theater
C. Bartender at a local pub
D. Sales clerk at a department store
```

**Bad Example:**
```
Question: "What is Penny's job?"
A. She works at The Cheesecake Factory as a waitress ✓
B. Teacher
C. I don't know
D. She doesn't have a job
```

### Explanation Requirements

**Must Include:**
- Brief factual statement (1-2 sentences)
- Reference to specific dialogue or action
- No speculation or interpretation

**Format:**
```
"[Character] [action/says] [specific quote or description] [when/where if relevant]."
```

**Good Examples:**
- "Monica tells her friends 'There's nothing to tell! He's just some guy I work with!' when asked about Paul."
- "Ross visits Carol's OB/GYN to attend the sonogram appointment."
- "Chandler reveals he has started smoking again after years of quitting."

**Bad Examples:**
- "This is obvious from the episode." (Not specific)
- "Monica is probably nervous." (Speculation)
- "It's mentioned somewhere." (Vague)

---

## 6. Content Filtering Rules

### AVOID These Question Types

❌ **Meta Questions**
- About the show itself ("What network aired this show?")
- About actors ("Who plays Ross?")
- About production ("What year was this filmed?")

❌ **General Knowledge**
- Questions answerable without watching the episode
- Character relationships established in other episodes
- Show lore not mentioned in this episode

❌ **Subjective Questions**
- Opinion-based ("Who is the funniest character?")
- Interpretation ("What does Monica really mean?")
- Predictions ("What will happen next?")

❌ **Trick Questions**
- Intentionally misleading wording
- Questions with no correct answer
- Questions requiring external knowledge

❌ **Low-Value Filler**
- Background noise dialogue
- Meaningless exchanges
- Transitional scenes with no content
- "Hello", "Goodbye", basic greetings

### PRIORITIZE These Elements

✅ **Plot-Driving Dialogue**
- Character revelations
- Important decisions
- Conflict moments
- Resolution scenes

✅ **Character Development**
- Motivations revealed
- Relationships established/changed
- Personal growth moments
- Emotional reactions

✅ **Memorable Moments**
- Funny exchanges
- Dramatic reveals
- Iconic scenes
- Episode-defining events

---

## 7. AI Prompt Engineering Rules

### System Prompt Template

```
You are an expert quiz question generator for TV shows. Generate {N} high-quality multiple-choice questions from this episode transcript.

CRITICAL REQUIREMENTS:
1. Questions MUST be specific to THIS episode only
2. Reference exact dialogue, actions, or plot points from the transcript
3. Exactly ONE clearly correct answer per question
4. Write questions directly without episode name prefix
5. NO general show knowledge questions
6. NO subjective or opinion questions

DIFFICULTY DISTRIBUTION:
- Easy (30-40%): Basic plot points, obvious character actions, main events
- Medium (40-50%): Specific dialogue quotes, character motivations, scene details
- Hard (10-20%): Subtle details, minor characters, background events

QUESTION TYPES:
- Dialogue (35-45%): "What does X say about Y?"
- Scene (20-30%): "What happens when X?"
- Character (15-25%): "Why does X do Y?"
- Plot (10-20%): "What is revealed about X?"
- Object/Setting (5-10%): "What object is mentioned?"

FORMAT REQUIREMENTS:
- Exactly 4 options per question
- Options similar in length and structure
- No "All of the above" or "None of the above"
- Include brief factual explanations
```

### User Prompt Template

```
**Show:** {series_name}
**Episode:** {episode_title}
**Word Count:** {word_count}

**Transcript:**
{transcript_text}

**Generate exactly {question_count} questions following all rules above.**

**Output Format (JSON only):**
{
  "questions": [
    {
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "correct_answer": "exact match to one option",
      "difficulty": "easy|medium|hard",
      "type": "dialogue|scene|character|plot|object",
      "explanation": "brief factual explanation"
    }
  ]
}
```

---

## 8. Validation Rules

### Pre-Generation Validation

✅ Transcript exists and is valid
✅ Transcript word count > 500
✅ Transcript has actual dialogue (not just scene descriptions)
✅ Character names present (if available)

### Post-Generation Validation

✅ **Count Validation**
- Question count within min/max range
- Total equals expected count

✅ **Format Validation**
- All questions have exactly 4 options
- All questions have exactly 1 correct answer
- Correct answer exactly matches one option (case-sensitive)
- All required fields present

✅ **Distribution Validation**
- Difficulty distribution within acceptable range
- Question type distribution within acceptable range

✅ **Uniqueness Validation**
- No duplicate questions
- No duplicate correct answers (within reason)
- No overlapping options across questions

✅ **Quality Validation**
- No questions shorter than 10 characters
- No options shorter than 2 characters
- No questions with "All of the above" / "None of the above"
- All explanations present and > 10 characters

### Validation Failure Actions

**Minor Violations:**
- Log warning
- Flag for manual review
- Accept but mark as "needs_review"

**Major Violations:**
- Reject entire batch
- Regenerate questions
- Log error with details

---

## 9. Error Handling & Edge Cases

### Insufficient Transcript

**If word count < 1000:**
- Reduce target question count by 30%
- Increase easy question percentage to 50%
- Flag as "low_content"

### Poor Quality Transcript

**If no character names:**
- Focus more on plot and scene questions
- Reduce dialogue question percentage to 20%
- Increase scene/plot percentage

**If mostly scene descriptions:**
- Focus on action and setting questions
- Reduce dialogue percentage
- Flag as "description_heavy"

### AI Generation Failures

**If AI returns wrong count:**
- Retry once with adjusted prompt
- If still fails, accept closest valid set
- Log discrepancy

**If AI returns invalid JSON:**
- Retry with stricter format instructions
- If fails again, use fallback parser
- Log parsing error

**If AI returns low-quality questions:**
- Check validation rules
- If 30%+ fail validation, regenerate
- If <30% fail, remove failed and keep valid

---

## 10. Quality Metrics & Benchmarks

### Success Criteria

**Episode Level:**
- ✅ 90%+ questions pass validation
- ✅ Difficulty distribution within ±10% of target
- ✅ Type distribution within ±10% of target
- ✅ Zero duplicate questions
- ✅ All answers verifiable from transcript

**Season Level:**
- ✅ Average questions per episode within target range
- ✅ Consistent difficulty distribution across episodes
- ✅ No cross-episode duplicate questions

**Series Level:**
- ✅ Overall question quality score > 8/10
- ✅ Consistent generation patterns
- ✅ Complete coverage of all episodes

### Quality Scoring

**Question Quality Score (0-10):**
```
Score = (
  Specificity (0-2) +
  Answer Clarity (0-2) +
  Option Quality (0-2) +
  Explanation Quality (0-2) +
  Verifiability (0-2)
)
```

**Target:** Average score > 8.0 per episode

---

## 11. Continuous Improvement

### Feedback Loop

1. **Validation Results** → Adjust AI prompt
2. **Failed Questions** → Update filtering rules
3. **User Feedback** → Refine quality criteria
4. **Pattern Detection** → Add specific rules

### Version Control

- Document all ruleset changes
- Track version in manifest
- A/B test rule modifications
- Roll back if quality degrades

---

## Summary Checklist

Before generating questions, verify:

- [ ] Transcript validated
- [ ] Word count calculated
- [ ] Target question count determined
- [ ] Difficulty distribution configured
- [ ] Type distribution configured
- [ ] AI prompt prepared
- [ ] Validation rules loaded

After generating questions, verify:

- [ ] Count matches target (±10%)
- [ ] All questions pass format validation
- [ ] Difficulty distribution correct
- [ ] Type distribution correct
- [ ] No duplicates
- [ ] All explanations present
- [ ] Quality score > 8.0

---

**Status:** Ready for implementation
**Version:** 1.0
**Last Updated:** 2025-12-16
