import { describe, it, expect } from 'vitest'
import { isCorrect, QUESTIONS, MCQQuestion, SubjectiveQuestion } from './questions'

const mcq: MCQQuestion = {
  id: 'q1', type: 'mcq', text: 'What is 2+2?',
  concept: 'Addition', difficulty: 1,
  options: ['3', '4', '5', '6'], correctIndex: 1,
}

const subjective: SubjectiveQuestion = {
  id: 'q2', type: 'subjective', text: 'How many legs does a dog have?',
  concept: 'General', difficulty: 1,
  correctAnswer: '4',
  acceptedAnswers: ['four'],
}

describe('isCorrect', () => {
  describe('MCQ', () => {
    it('returns true for correct index', () => {
      expect(isCorrect(mcq, 1)).toBe(true)
    })
    it('returns false for wrong index', () => {
      expect(isCorrect(mcq, 0)).toBe(false)
    })
    it('returns false for unanswered (-1)', () => {
      expect(isCorrect(mcq, -1)).toBe(false)
    })
    it('returns false when a string index is passed instead of number', () => {
      expect(isCorrect(mcq, '1')).toBe(false)
    })
  })

  describe('subjective — exact match', () => {
    it('returns true for exact correctAnswer', () => {
      expect(isCorrect(subjective, '4')).toBe(true)
    })
    it('returns true case-insensitively', () => {
      expect(isCorrect(subjective, 'FOUR')).toBe(true)
    })
    it('returns true ignoring surrounding whitespace', () => {
      expect(isCorrect(subjective, '  4  ')).toBe(true)
    })
    it('returns true for acceptedAnswers variant', () => {
      expect(isCorrect(subjective, 'four')).toBe(true)
    })
    it('returns false for wrong answer', () => {
      expect(isCorrect(subjective, '3')).toBe(false)
    })
    it('returns false for empty string', () => {
      expect(isCorrect(subjective, '')).toBe(false)
    })
  })
})

describe('QUESTIONS loader', () => {
  it('loads 12 questions from all concept files', () => {
    expect(QUESTIONS).toHaveLength(12)
  })
  it('first question is MCQ', () => {
    expect(QUESTIONS[0].type).toBe('mcq')
  })
  it('contains exactly 3 subjective questions', () => {
    const count = QUESTIONS.filter(q => q.type === 'subjective').length
    expect(count).toBe(3)
  })
  it('contains both MCQ and subjective types', () => {
    const types = [...new Set(QUESTIONS.map(q => q.type))]
    expect(types).toContain('mcq')
    expect(types).toContain('subjective')
  })
})
