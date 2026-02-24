export interface Question {
  text: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  concept: string
}

export const QUESTIONS: Question[] = [
  // Addition (Q1-3)
  {
    text: 'What is 4 + 3?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2,
    concept: 'Addition',
  },
  {
    text: 'What is 9 + 6?',
    options: ['14', '15', '16', '17'],
    correctIndex: 1,
    concept: 'Addition',
  },
  {
    text: 'What is 13 + 8?',
    options: ['19', '20', '21', '22'],
    correctIndex: 2,
    concept: 'Addition',
  },
  // Subtraction (Q4-6)
  {
    text: 'What is 10 − 4?',
    options: ['5', '6', '7', '8'],
    correctIndex: 1,
    concept: 'Subtraction',
  },
  {
    text: 'What is 15 − 7?',
    options: ['7', '8', '9', '10'],
    correctIndex: 1,
    concept: 'Subtraction',
  },
  {
    text: 'What is 23 − 9?',
    options: ['12', '13', '14', '15'],
    correctIndex: 2,
    concept: 'Subtraction',
  },
  // Multiplication (Q7-10)
  {
    text: 'What is 6 × 7?',
    options: ['36', '40', '42', '48'],
    correctIndex: 2,
    concept: 'Multiplication',
  },
  {
    text: 'What is 8 × 9?',
    options: ['63', '72', '78', '81'],
    correctIndex: 1,
    concept: 'Multiplication',
  },
  {
    text: 'What is 7 × 8?',
    options: ['48', '54', '56', '64'],
    correctIndex: 2,
    concept: 'Multiplication',
  },
  {
    text: 'What is 4 × 6?',
    options: ['20', '22', '24', '26'],
    correctIndex: 2,
    concept: 'Multiplication',
  },
]
