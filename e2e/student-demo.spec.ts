import { test, expect } from '@playwright/test'

test.describe('Student quiz flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student-demo')
  })

  test('shows Question 1 of 12 on load', async ({ page }) => {
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 12')
  })

  test('progress bar is visible', async ({ page }) => {
    await expect(page.getByTestId('progress-bar')).toBeVisible()
  })

  test('Next without selection does not advance', async ({ page }) => {
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 12')
  })

  test('selecting an MCQ answer highlights the button', async ({ page }) => {
    await page.getByTestId('option-0').click()
    await expect(page.getByTestId('option-0')).toHaveClass(/border-amber-500/)
  })

  test('Next after MCQ selection advances to question 2', async ({ page }) => {
    await page.getByTestId('option-0').click()
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 2 of 12')
  })

  test('Back restores question 1 with prior selection', async ({ page }) => {
    await page.getByTestId('option-1').click()
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 2 of 12')
    await page.getByTestId('back-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 12')
    await expect(page.getByTestId('option-1')).toHaveClass(/border-amber-500/)
  })

  test('subjective question shows text input instead of option buttons', async ({ page }) => {
    // Navigate to Q11 (first subjective question, index 10)
    for (let i = 0; i < 10; i++) {
      await page.getByTestId('option-0').click()
      await page.getByTestId('next-btn').click()
    }
    await expect(page.getByTestId('question-label')).toContainText('Question 11 of 12')
    await expect(page.getByTestId('subjective-input')).toBeVisible()
    await expect(page.getByTestId('option-0')).not.toBeVisible()
  })

  test('Next blocked until subjective input is non-empty', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.getByTestId('option-0').click()
      await page.getByTestId('next-btn').click()
    }
    // On Q11 — input empty
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 11 of 12')
    // Type something — Next should advance
    await page.getByTestId('subjective-input').fill('7')
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 12 of 12')
  })

  test('completing all 12 questions shows score screen', async ({ page }) => {
    for (let i = 0; i < 12; i++) {
      const optionBtn = page.getByTestId('option-0')
      if (await optionBtn.isVisible()) {
        await optionBtn.click()
      } else {
        await page.getByTestId('subjective-input').fill('42')
      }
      await page.getByTestId('next-btn').click()
    }
    await expect(page.getByTestId('score-heading')).toContainText('/ 12 correct')
  })

  test('Try Again resets to question 1', async ({ page }) => {
    for (let i = 0; i < 12; i++) {
      const optionBtn = page.getByTestId('option-0')
      if (await optionBtn.isVisible()) {
        await optionBtn.click()
      } else {
        await page.getByTestId('subjective-input').fill('42')
      }
      await page.getByTestId('next-btn').click()
    }
    await page.getByTestId('try-again').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 12')
  })

  test('score reflects correct answers', async ({ page }) => {
    // MCQ correct picks: Q1→idx2(7), Q2→idx1(15), Q3→idx2(21), Q4-Q10→idx0(wrong)
    // Subjective: Q11→'7'(correct), Q12→'wrong'
    const mcqPicks = [2, 1, 2, 0, 0, 0, 0, 0, 0, 0]
    for (const pick of mcqPicks) {
      await page.getByTestId(`option-${pick}`).click()
      await page.getByTestId('next-btn').click()
    }
    await page.getByTestId('subjective-input').fill('7')   // Q11 correct
    await page.getByTestId('next-btn').click()
    await page.getByTestId('subjective-input').fill('wrong') // Q12 wrong
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('score-heading')).toContainText('You got 4 / 12 correct!')
  })
})
