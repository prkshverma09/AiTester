import { test, expect } from '@playwright/test'

test.describe('Full student journey', () => {
  // Scenario 1 starts from the home page, so it handles its own navigation.
  // Scenarios 2–5 all start at /student-demo, so beforeEach covers them.
  // We skip beforeEach here and use explicit gotos per test to keep things clear.

  test('student navigates from home, reads the first question, and answers it', async ({ page }) => {
    // Student opens the app at the home page
    await page.goto('/')

    // Student sees the home page and clicks the Student Test View link
    await page.getByRole('link', { name: /student test view/i }).click()

    // Student lands on the quiz page
    await expect(page).toHaveURL('/student-demo')

    // Student sees "Question 1 of 10" — they know how many questions to expect
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 10')

    // Student reads the first question: "What is 4 + 3?"
    await expect(page.getByText('What is 4 + 3?')).toBeVisible()

    // Student sees all four answer options: 5, 6, 7, 8
    await expect(page.getByTestId('option-0')).toContainText('5')
    await expect(page.getByTestId('option-1')).toContainText('6')
    await expect(page.getByTestId('option-2')).toContainText('7')
    await expect(page.getByTestId('option-3')).toContainText('8')

    // Student thinks about it and clicks the correct answer: '7' (option-2)
    await page.getByTestId('option-2').click()

    // Student sees option-2 highlighted with the amber border
    await expect(page.getByTestId('option-2')).toHaveClass(/border-amber-500/)

    // Student clicks Next to move on
    await page.getByTestId('next-btn').click()

    // Student is now on the second question
    await expect(page.getByTestId('question-label')).toContainText('Question 2 of 10')

    // Student reads the new question: "What is 9 + 6?"
    await expect(page.getByText('What is 9 + 6?')).toBeVisible()
  })

  test('student changes their mind and goes back to correct their answer', async ({ page }) => {
    // Student starts at the quiz
    await page.goto('/student-demo')

    // Student reads Q1 and hastily picks the wrong answer: '5' (option-0)
    await page.getByTestId('option-0').click()

    // Student sees option-0 highlighted — they've committed to '5'
    await expect(page.getByTestId('option-0')).toHaveClass(/border-amber-500/)

    // Student clicks Next, moving to Q2
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 2 of 10')

    // Student pauses and thinks — wait, 4 + 3 is NOT 5! They click Back to go back
    await page.getByTestId('back-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 10')

    // Student is relieved to see their previous selection (option-0) is still shown
    await expect(page.getByTestId('option-0')).toHaveClass(/border-amber-500/)

    // Student clicks the correct answer: '7' (option-2) to change their selection
    await page.getByTestId('option-2').click()

    // Student sees option-2 is now highlighted (the correct answer)
    await expect(page.getByTestId('option-2')).toHaveClass(/border-amber-500/)

    // Student also verifies the old wrong answer is no longer highlighted
    await expect(page.getByTestId('option-0')).not.toHaveClass(/border-amber-500/)

    // Student clicks Next, advancing to Q2 with the corrected answer
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 2 of 10')
  })

  test('student completes 5 questions in a row', async ({ page }) => {
    // Student starts the quiz
    await page.goto('/student-demo')

    // Student answers Q1: clicks '7' (option-2, correct) and moves on
    await page.getByTestId('option-2').click()
    await page.getByTestId('next-btn').click()

    // Student answers Q2: clicks '15' (option-1, correct) and moves on
    await page.getByTestId('option-1').click()
    await page.getByTestId('next-btn').click()

    // Student answers Q3: clicks '21' (option-2, correct) and moves on
    await page.getByTestId('option-2').click()
    await page.getByTestId('next-btn').click()

    // Student gets a bit confused on Q4 — picks '5' (option-0, wrong answer) and moves on
    await page.getByTestId('option-0').click()
    await page.getByTestId('next-btn').click()

    // Student is still unsure on Q5 — picks '7' (option-0, wrong answer) and moves on
    await page.getByTestId('option-0').click()
    await page.getByTestId('next-btn').click()

    // Student has answered 5 questions and now sees Question 6 of 10
    await expect(page.getByTestId('question-label')).toContainText('Question 6 of 10')

    // Student reads the next question: subtraction — "What is 23 − 9?"
    await expect(page.getByText('What is 23 − 9?')).toBeVisible()

    // Student notices the concept badge now shows "Subtraction"
    await expect(page.getByText('Subtraction')).toBeVisible()
  })

  test('student completes the full 10-question test and sees their score', async ({ page }) => {
    // Student begins the full quiz
    await page.goto('/student-demo')

    // Q1: student picks the correct answer '7' (option-2)
    await page.getByTestId('option-2').click()
    await page.getByTestId('next-btn').click()

    // Q2: student picks the correct answer '15' (option-1)
    await page.getByTestId('option-1').click()
    await page.getByTestId('next-btn').click()

    // Q3: student picks the correct answer '21' (option-2)
    await page.getByTestId('option-2').click()
    await page.getByTestId('next-btn').click()

    // Q4: student picks the wrong answer '5' (option-0, correct is '6')
    await page.getByTestId('option-0').click()
    await page.getByTestId('next-btn').click()

    // Q5: student picks the wrong answer '7' (option-0, correct is '8')
    await page.getByTestId('option-0').click()
    await page.getByTestId('next-btn').click()

    // Q6: student picks the correct answer '14' (option-2)
    await page.getByTestId('option-2').click()
    await page.getByTestId('next-btn').click()

    // Q7: student picks the wrong answer '36' (option-0, correct is '42')
    await page.getByTestId('option-0').click()
    await page.getByTestId('next-btn').click()

    // Q8: student picks the correct answer '72' (option-1)
    await page.getByTestId('option-1').click()
    await page.getByTestId('next-btn').click()

    // Q9: student picks the wrong answer '48' (option-0, correct is '56')
    await page.getByTestId('option-0').click()
    await page.getByTestId('next-btn').click()

    // Q10: student picks the correct answer '24' (option-2)
    await page.getByTestId('option-2').click()
    await page.getByTestId('next-btn').click()

    // Student has finished all 10 questions — the score screen appears
    await expect(page.getByTestId('score-heading')).toBeVisible()

    // Student reads their result: 6 out of 10 correct (Q1, Q2, Q3, Q6, Q8, Q10)
    await expect(page.getByTestId('score-heading')).toContainText('You got 6 / 10 correct!')

    // Student sees their percentage score: 60%
    await expect(page.getByText('60%')).toBeVisible()

    // Student sees the "Try Again" button to retake the quiz
    await expect(page.getByTestId('try-again')).toBeVisible()
  })

  test('student retakes the test after seeing their score', async ({ page }) => {
    // Student starts the quiz for the first time
    await page.goto('/student-demo')

    // Student rushes through all 10 questions, picking option-0 each time
    for (let q = 0; q < 10; q++) {
      // Student picks the first available option and moves on
      await page.getByTestId('option-0').click()
      await page.getByTestId('next-btn').click()
    }

    // Student sees the score screen after completing all questions
    await expect(page.getByTestId('score-heading')).toBeVisible()

    // Student is not happy with their result and clicks "Try Again"
    await page.getByTestId('try-again').click()

    // Student is back at the beginning: Question 1 of 10
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 10')

    // Student verifies no answer is pre-selected — the slate is clean
    await expect(page.getByTestId('option-0')).not.toHaveClass(/border-amber-500/)
    await expect(page.getByTestId('option-1')).not.toHaveClass(/border-amber-500/)
    await expect(page.getByTestId('option-2')).not.toHaveClass(/border-amber-500/)
    await expect(page.getByTestId('option-3')).not.toHaveClass(/border-amber-500/)

    // Student takes their time this round and picks the correct answer '7' (option-2)
    await page.getByTestId('option-2').click()

    // Student sees option-2 highlighted, confirming their selection was registered
    await expect(page.getByTestId('option-2')).toHaveClass(/border-amber-500/)
  })
})
