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
    // Navigate to Q3 (first subjective question, index 2) — only 2 MCQ clicks needed
    for (let i = 0; i < 2; i++) {
      await page.getByTestId('option-0').click()
      await page.getByTestId('next-btn').click()
    }
    await expect(page.getByTestId('question-label')).toContainText('Question 3 of 12')
    await expect(page.getByTestId('subjective-input')).toBeVisible()
    await expect(page.getByTestId('option-0')).not.toBeVisible()
  })

  test('Next blocked until subjective input is non-empty', async ({ page }) => {
    for (let i = 0; i < 2; i++) {
      await page.getByTestId('option-0').click()
      await page.getByTestId('next-btn').click()
    }
    // On Q3 — input empty
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 3 of 12')
    // Type something — Next should advance
    await page.getByTestId('subjective-input').fill('8')
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 4 of 12')
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
    // Q1: MCQ → option-2 correct (4+3=7)
    await page.getByTestId('option-2').click()
    await page.getByTestId('next-btn').click()
    // Q2: MCQ → option-1 correct (9+6=15)
    await page.getByTestId('option-1').click()
    await page.getByTestId('next-btn').click()
    // Q3: Subjective → '8' correct (Tom apples)
    await page.getByTestId('subjective-input').fill('8')
    await page.getByTestId('next-btn').click()
    // Q4: MCQ → option-0 wrong (10-4=6, picked '5')
    await page.getByTestId('option-0').click()
    await page.getByTestId('next-btn').click()
    // Q5: MCQ → option-0 wrong (15-7=8, picked '7')
    await page.getByTestId('option-0').click()
    await page.getByTestId('next-btn').click()
    // Q6: Subjective → '7' correct (Sam stickers)
    await page.getByTestId('subjective-input').fill('7')
    await page.getByTestId('next-btn').click()
    // Q7 through Q12: all wrong (option-0 for MCQ, 'wrong' for subjective)
    for (let i = 0; i < 6; i++) {
      const optionBtn = page.getByTestId('option-0')
      if (await optionBtn.isVisible()) {
        await optionBtn.click()
      } else {
        await page.getByTestId('subjective-input').fill('wrong')
      }
      await page.getByTestId('next-btn').click()
    }
    // Q1✓ Q2✓ Q3✓ Q6✓ = 4 correct
    await expect(page.getByTestId('score-heading')).toContainText('You got 4 / 12 correct!')
  })
})
