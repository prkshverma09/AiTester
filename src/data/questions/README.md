# Question sets (one JSON file per concept)

Each **concept** has its own JSON file here. The app loads questions from these files and shows each concept as a separate test on the student dashboard.

## Adding more questions to an existing concept

Edit the JSON file for that concept (e.g. `addition.json`, `subtraction.json`, `multiplication.json`) and add more objects to the `"questions"` array.

### Question format

**Multiple choice (MCQ):**
```json
{
  "id": "q-unique-id",
  "type": "mcq",
  "text": "What is 4 + 3?",
  "concept": "Addition",
  "difficulty": 1,
  "tags": ["single-digit"],
  "options": ["5", "6", "7", "8"],
  "correctIndex": 2
}
```
- `correctIndex` is 0-based (e.g. `2` = third option, "7").
- `difficulty`: 1–5.
- `tags`: optional array of strings.

**Subjective (short answer):**
```json
{
  "id": "q-unique-id",
  "type": "subjective",
  "text": "Tom has 3 apples. His friend gives him 5 more. How many apples does he have?",
  "concept": "Addition",
  "difficulty": 1,
  "tags": ["word-problem"],
  "correctAnswer": "8",
  "acceptedAnswers": ["eight"]
}
```
- Answer is matched after trimming and lowercasing. Add spelling variants in `acceptedAnswers` if needed.

## Adding a new concept

1. **Create a new JSON file** in this folder, e.g. `division.json`, with this structure:

```json
{
  "id": "division",
  "name": "Division",
  "description": "Optional short description",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "text": "What is 12 ÷ 3?",
      "concept": "Division",
      "difficulty": 2,
      "options": ["3", "4", "6", "9"],
      "correctIndex": 1
    }
  ]
}
```
- `name` must be unique and is used in the URL and UI (e.g. "Division").
- `id` is a slug for the set (e.g. "division"); keep it in sync with the concept.

2. **Register the concept** in `src/data/questions.ts`:
   - Add an import: `import divisionSet from './questions/division.json'`
   - Add an entry to the `CONCEPT_SETS` object: `Division: divisionSet as QuestionSet`

After that, "Division" will appear on the student dashboard and its questions will load from `division.json`.
