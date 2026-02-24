import { test, expect } from '@playwright/test'

test.describe('Student quiz flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student-demo')
  })

  test('shows Question 1 of 10 on load', async ({ page }) => {
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 10')
  })

  test('progress bar is visible', async ({ page }) => {
    await expect(page.getByTestId('progress-bar')).toBeVisible()
  })

  test('Next without selection does not advance', async ({ page }) => {
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 10')
  })

  test('selecting an answer highlights the button', async ({ page }) => {
    await page.getByTestId('option-0').click()
    await expect(page.getByTestId('option-0')).toHaveClass(/border-amber-500/)
  })

  test('Next after selection advances to question 2', async ({ page }) => {
    await page.getByTestId('option-0').click()
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 2 of 10')
  })

  test('Back restores question 1 with prior selection', async ({ page }) => {
    await page.getByTestId('option-1').click()
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 2 of 10')
    await page.getByTestId('back-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 10')
    await expect(page.getByTestId('option-1')).toHaveClass(/border-amber-500/)
  })

  test('completing all 10 questions shows score screen', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.getByTestId('option-0').click()
      await page.getByTestId('next-btn').click()
    }
    await expect(page.getByTestId('score-heading')).toContainText('/ 10 correct')
  })

  test('Try Again resets to question 1', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.getByTestId('option-0').click()
      await page.getByTestId('next-btn').click()
    }
    await page.getByTestId('try-again').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 10')
  })

  test('score reflects correct answers when choosing right options', async ({ page }) => {
    // Q1: 4+3=7, options=['5','6','7','8'], correctIndex=2 → option-2
    // Q2: 9+6=15, options=['14','15','16','17'], correctIndex=1 → option-1
    // Q3: 13+8=21, options=['19','20','21','22'], correctIndex=2 → option-2
    // Q4-Q10: always choose option-0 (wrong)
    const correctPicks = [2, 1, 2, 0, 0, 0, 0, 0, 0, 0]
    for (const pick of correctPicks) {
      await page.getByTestId(`option-${pick}`).click()
      await page.getByTestId('next-btn').click()
    }
    await expect(page.getByTestId('score-heading')).toContainText('You got 3 / 10 correct!')
  })
})
