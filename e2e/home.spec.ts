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

  test('navigates to parent login on link click', async ({ page }) => {
    await page.getByRole('link', { name: /parent login/i }).click()
    await expect(page).toHaveURL('/login/parent')
    await expect(
      page.getByRole('heading', { name: 'Parent Login' })
    ).toBeVisible()
  })

  test('navigates to student login on link click', async ({ page }) => {
    await page.getByRole('link', { name: /student login/i }).click()
    await expect(page).toHaveURL('/login/student')
    await expect(
      page.getByRole('heading', { name: 'Student Login' })
    ).toBeVisible()
  })
})
