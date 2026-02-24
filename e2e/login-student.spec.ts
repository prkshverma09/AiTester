import { test, expect } from '@playwright/test'

// Requires Supabase with test users seeded (see README).
// Set E2E_SKIP_AUTH=1 to skip auth-dependent tests when Supabase is not configured.
const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL ?? 'student@mathdiagnose.example'
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD ?? 'TestStudent123!'

test.describe('Student login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login/student')
  })

  test('shows student login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Student Login' })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('navigates to student dashboard on successful login', async ({ page }) => {
    test.skip(!!process.env.E2E_SKIP_AUTH, 'Requires Supabase with seeded test users')
    await page.getByLabel(/email/i).fill(STUDENT_EMAIL)
    await page.getByLabel(/password/i).fill(STUDENT_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/dashboard/student')
    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible()
  })

  test('student dashboard shows Take test section and concepts', async ({ page }) => {
    test.skip(!!process.env.E2E_SKIP_AUTH, 'Requires Supabase with seeded test users')
    await page.getByLabel(/email/i).fill(STUDENT_EMAIL)
    await page.getByLabel(/password/i).fill(STUDENT_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/dashboard/student')
    await expect(page.getByRole('heading', { name: /take a test/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /take test/i }).first()).toBeVisible()
  })

  test('shows error when using wrong account type', async ({ page }) => {
    test.skip(!!process.env.E2E_SKIP_AUTH, 'Requires Supabase with seeded test users')
    const parentEmail = process.env.E2E_PARENT_EMAIL ?? 'parent@mathdiagnose.example'
    const parentPassword = process.env.E2E_PARENT_PASSWORD ?? 'TestParent123!'
    await page.getByLabel(/email/i).fill(parentEmail)
    await page.getByLabel(/password/i).fill(parentPassword)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/login/student')
    await expect(page.getByRole('alert')).toContainText(/not a student account/i)
  })
})
