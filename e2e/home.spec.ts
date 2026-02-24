import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows MathDiagnose heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'MathDiagnose' })
    ).toBeVisible()
  })

  test('navigates to parent dashboard on link click', async ({ page }) => {
    await page.getByRole('link', { name: /parent dashboard/i }).click()
    await expect(page).toHaveURL('/parent-demo')
    await expect(
      page.getByRole('heading', { name: 'Dashboard' })
    ).toBeVisible()
  })

  test('navigates to student test view on link click', async ({ page }) => {
    await page.getByRole('link', { name: /student test view/i }).click()
    await expect(page).toHaveURL('/student-demo')
    await expect(page.getByTestId('question-label')).toContainText(
      'Question 1 of 10'
    )
  })
})
