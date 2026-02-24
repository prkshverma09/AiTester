import { test, expect } from '@playwright/test'

// Requires Supabase with test users seeded (see README). Run seed with parent + student auth users first.
// Set E2E_SKIP_AUTH=1 to skip these tests when Supabase is not configured.
const PARENT_EMAIL = process.env.E2E_PARENT_EMAIL ?? 'parent@mathdiagnose.example'
const PARENT_PASSWORD = process.env.E2E_PARENT_PASSWORD ?? 'TestParent123!'

test.describe('Parent login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login/parent')
  })

  test('shows parent login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Parent Login' })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('navigates to parent dashboard on successful login', async ({ page }) => {
    test.skip(!!process.env.E2E_SKIP_AUTH, 'Requires Supabase with seeded test users')
    await page.getByLabel(/email/i).fill(PARENT_EMAIL)
    await page.getByLabel(/password/i).fill(PARENT_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/dashboard/parent')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('shows error when using wrong account type', async ({ page }) => {
    test.skip(!!process.env.E2E_SKIP_AUTH, 'Requires Supabase with seeded test users')
    const studentEmail = process.env.E2E_STUDENT_EMAIL ?? 'student@mathdiagnose.example'
    const studentPassword = process.env.E2E_STUDENT_PASSWORD ?? 'TestStudent123!'
    await page.getByLabel(/email/i).fill(studentEmail)
    await page.getByLabel(/password/i).fill(studentPassword)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/login/parent')
    await expect(page.getByRole('alert')).toContainText(/not a parent account/i)
  })
})
