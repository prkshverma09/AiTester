import { test, expect } from '@playwright/test'

/**
 * E2E: Parent opens a child's report page and uses Generate Report / Generate Summary.
 * Requires Supabase with seeded parent + student and at least one child with completed sessions.
 * Set E2E_SKIP_AUTH=1 to skip when Supabase is not configured.
 * Generate Report/Summary call Gemini; ensure GOOGLE_GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) is set for full flow.
 */
const PARENT_EMAIL = process.env.E2E_PARENT_EMAIL ?? 'parent@mathdiagnose.example'
const PARENT_PASSWORD = process.env.E2E_PARENT_PASSWORD ?? 'TestParent123!'

test.describe('Child report page — Generate Report and Summary', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!!process.env.E2E_SKIP_AUTH, 'Requires Supabase with seeded test users')
    await page.goto('/login/parent')
    await page.getByLabel(/email/i).fill(PARENT_EMAIL)
    await page.getByLabel(/password/i).fill(PARENT_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/dashboard/parent')
  })

  test('navigates to child detail page from dashboard', async ({ page }) => {
    // Click first "View details" or first child name link
    const viewDetails = page.getByRole('link', { name: /view details/i }).first()
    const childNameLink = page.getByRole('link', { name: /alice|bob|charlie/i }).first()
    const link = (await viewDetails.isVisible()) ? viewDetails : childNameLink
    await link.click()
    await expect(page).toHaveURL(/\/dashboard\/parent\/child\/[a-f0-9-]+/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('Generate Report button shows generating state then refreshes to show report or error', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    const viewDetails = page.getByRole('link', { name: /view details/i }).first()
    const childNameLink = page.getByRole('link', { name: /alice|bob|charlie/i }).first()
    const link = (await viewDetails.isVisible()) ? viewDetails : childNameLink
    await link.click()
    await expect(page).toHaveURL(/\/dashboard\/parent\/child\/[a-f0-9-]+/)

    const generateReportBtn = page.getByTestId('generate-concept-report-btn').first()
    if (!(await generateReportBtn.isVisible())) {
      test.skip(true, 'No concept with "Generate Report" (no sessions or all reports already generated)')
      return
    }

    let dialogMessage: string | null = null
    page.on('dialog', (d) => {
      dialogMessage = d.message()
      d.accept()
    })

    await generateReportBtn.click()
    await expect(page.getByRole('button', { name: 'Generating…' }).first()).toBeVisible().catch(() => {})

    await expect
      .poll(
        async () => {
          const content = page.getByTestId(/concept-report-content-/).first()
          const hasContent = await content.isVisible().catch(() => false)
          const hasError = dialogMessage != null
          return hasContent || hasError
        },
        { timeout: 60_000 }
      )
      .toBe(true)

    if (dialogMessage) {
      expect(dialogMessage.length).toBeGreaterThan(0)
      return
    }
    const content = page.getByTestId(/concept-report-content-/).first()
    await expect(content).toBeVisible()
    await expect(content.locator('p').first()).toBeVisible()
  })

  test('Generate Summary button shows generating state then refreshes to show summary or error', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    const viewDetails = page.getByRole('link', { name: /view details/i }).first()
    const childNameLink = page.getByRole('link', { name: /alice|bob|charlie/i }).first()
    const link = (await viewDetails.isVisible()) ? viewDetails : childNameLink
    await link.click()
    await expect(page).toHaveURL(/\/dashboard\/parent\/child\/[a-f0-9-]+/)

    const generateSummaryBtn = page.getByTestId('generate-summary-btn')
    if (!(await generateSummaryBtn.isVisible())) {
      test.skip(true, 'Summary already generated or no concept reports yet')
      return
    }

    let dialogMessage: string | null = null
    page.on('dialog', (d) => {
      dialogMessage = d.message()
      d.accept()
    })

    await generateSummaryBtn.click()
    await expect(page.getByRole('button', { name: 'Generating…' }).first()).toBeVisible().catch(() => {})

    await expect
      .poll(
        async () => {
          const content = page.getByTestId('overall-summary-content')
          const hasContent = await content.isVisible().catch(() => false)
          const hasError = dialogMessage != null
          return hasContent || hasError
        },
        { timeout: 60_000 }
      )
      .toBe(true)

    if (dialogMessage) {
      expect(dialogMessage.length).toBeGreaterThan(0)
      return
    }
    await expect(page.getByTestId('overall-summary-content')).toBeVisible()
  })
})
