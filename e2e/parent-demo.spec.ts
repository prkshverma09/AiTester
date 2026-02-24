import { test, expect } from '@playwright/test'

test.describe('Parent dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/parent-demo')
  })

  test('shows Dashboard heading and welcome text', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Dashboard' })
    ).toBeVisible()
    await expect(page.getByText(/Sarah.*3 children/)).toBeVisible()
  })

  test('shows Alice card with age 8 and 85% score', async ({ page }) => {
    // Use heading role to target the card title specifically (CardTitle renders as a heading)
    // and scope Age/score checks to the card containing Alice
    const aliceCard = page.locator('[data-slot="card"]').filter({ hasText: 'Age 8' })
    await expect(aliceCard.getByText('Alice')).toBeVisible()
    await expect(aliceCard.getByText('Age 8')).toBeVisible()
    await expect(aliceCard.getByText('85%')).toBeVisible()
  })

  test('shows Bob card with age 10 and 62% score', async ({ page }) => {
    const bobCard = page.locator('[data-slot="card"]').filter({ hasText: 'Age 10' })
    await expect(bobCard.getByText('Bob')).toBeVisible()
    await expect(bobCard.getByText('Age 10')).toBeVisible()
    await expect(bobCard.getByText('62%')).toBeVisible()
  })

  test('shows Charlie card with no sessions message', async ({ page }) => {
    const charlieCard = page.locator('[data-slot="card"]').filter({ hasText: 'Age 7' })
    await expect(charlieCard.getByText('Charlie')).toBeVisible()
    await expect(charlieCard.getByText('No sessions yet')).toBeVisible()
  })

  test('shows exactly 3 Start Test buttons', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Start Test' })
    ).toHaveCount(3)
  })

  test('recent sessions table has exactly 4 data rows', async ({ page }) => {
    await expect(page.locator('tbody tr')).toHaveCount(4)
  })

  // Score colour classes (text-green-600 / text-amber-600) are only present on the
  // <span> elements inside tbody, NOT on the Badge components in the student cards.
  // Using tbody-scoped locators to target the correct elements unambiguously.
  test('score colours: 91% and 85% are green, 74% and 62% are amber', async ({ page }) => {
    await expect(page.locator('tbody').getByText('91%')).toHaveClass(/text-green-600/)
    await expect(page.locator('tbody').getByText('85%')).toHaveClass(/text-green-600/)
    await expect(page.locator('tbody').getByText('74%')).toHaveClass(/text-amber-600/)
    await expect(page.locator('tbody').getByText('62%')).toHaveClass(/text-amber-600/)
  })

  test('shows exactly 4 View Report buttons', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'View Report' })
    ).toHaveCount(4)
  })

  test('shows Add Child button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '+ Add Child' })
    ).toBeVisible()
  })
})
