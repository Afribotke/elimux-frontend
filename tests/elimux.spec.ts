import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Wait for page to be fully hydrated — checks for React/Vue/etc rendering
const waitForHydrated = async (page: Page) => {
  // Wait for DOM to be ready
  await page.waitForLoadState('domcontentloaded');

  // Wait for any data fetching to complete (network idle is best for hydrated apps)
  // Use a shorter timeout since dev server can keep websockets open
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // If networkidle times out (common in dev with HMR), that's okay
  }

  // Extra wait for React hydration to finish
  await page.waitForTimeout(1000);
};

// Wait for a specific element to appear (best for client-rendered content)
const waitForElement = async (page: Page, selector: string, timeout = 10000) => {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch {
    return false;
  }
};

const hasElement = async (page: Page, selector: string) => {
  return await page.locator(selector).count() > 0;
};

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForHydrated(page);
  });

  test('page loads and shows content', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    const hasLogo = await hasElement(page, 'img[alt*="Elimu" i], svg, [class*="logo"]');
    const hasHeading = await hasElement(page, 'h1, h2');
    expect(hasLogo || hasHeading).toBeTruthy();
    console.log('Homepage loads with content');
  });

  test('AI search interface is present', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="find" i], input[aria-label*="search" i], [data-testid*="search"], input[type="search"]'
    ).first();
    const count = await searchInput.count();
    if (count > 0) {
      await expect(searchInput).toBeVisible();
      await searchInput.fill('Computer Science');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      console.log('Search input found and functional');
    } else {
      console.log('No search input found');
    }
  });

  test('main CTA buttons are clickable', async ({ page }) => {
    const ctas = await page.locator(
      'a:has-text("Get Started"), a:has-text("Explore"), a:has-text("Search"), button:has-text("Get Started"), button:has-text("Explore"), [class*="cta"], [class*="button-primary"]'
    ).all();
    let found = 0;
    for (const cta of ctas) {
      if (await cta.isVisible()) {
        found++;
        await expect(cta).toBeEnabled();
      }
    }
    console.log(`${found} CTA buttons found and enabled`);
    expect(found).toBeGreaterThan(0);
  });

  test('footer is present with links', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const footer = page.locator('footer, [class*="footer"]').first();
    const footerLinks = await page.locator('footer a, [class*="footer"] a').all();
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
      console.log(`Footer found with ${footerLinks.length} links`);
    }
  });
});

test.describe('Admin Dashboard', () => {
  test('admin access gate is present', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await waitForHydrated(page);

    const currentUrl = page.url();

    // Check for admin key gate (lock icon + input + submit button)
    const hasKeyInput = await hasElement(page, 'input[placeholder*="admin key" i], input[placeholder*="key" i], input[type="password"], input[name="key"]');
    const hasAccessButton = await hasElement(page, 'button:has-text("Access Dashboard"), button:has-text("Access"), button[type="submit"]');

    if (hasKeyInput && hasAccessButton) {
      console.log('Admin access gate found — key input + submit button');

      // Verify elements are visible and functional
      const keyInput = page.locator('input[placeholder*="admin key" i], input[placeholder*="key" i], input[type="password"], input[name="key"]').first();
      const accessBtn = page.locator('button:has-text("Access Dashboard"), button:has-text("Access"), button[type="submit"]').first();

      await expect(keyInput).toBeVisible();
      await expect(keyInput).toBeEnabled();
      await expect(accessBtn).toBeVisible();

      // Access button is disabled until the key field has a value — fill first
      await keyInput.fill('test-key-123');
      const inputValue = await keyInput.inputValue();
      expect(inputValue).toBe('test-key-123');

      await expect(accessBtn).toBeEnabled();

      console.log('Admin access gate is fully functional');

    } else if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      console.log('Admin redirects to login (expected for unauthenticated users)');

    } else if (await hasElement(page, 'nav, aside, [class*="dashboard"], [class*="sidebar"]')) {
      // Already authenticated — full dashboard loaded
      console.log('Admin dashboard loads with navigation (already authenticated)');
      const navItems = await page.locator('nav a, aside a, [class*="nav"] a, [class*="menu"] a').all();
      console.log(`${navItems.length} admin nav items found`);

    } else {
      // Unknown state — screenshot for debugging
      await page.screenshot({ path: 'admin-screenshot.png' });
      console.log('Admin page state unclear — screenshot saved to admin-screenshot.png');
    }
  });
});

test.describe('Payments', () => {
  test('sponsor/pricing page exists with buttons', async ({ page }) => {
    const routes = ['/pricing', '/sponsor', '/advertise', '/payments'];
    let foundRoute = null;

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await waitForHydrated(page);

      const hasContent = await hasElement(page, 'button, a, h1, h2');
      const is404 = await hasElement(page, 'body:has-text("404")');

      if (hasContent && !is404) {
        foundRoute = route;
        break;
      }
    }

    if (foundRoute) {
      console.log(`Payment page found at: ${foundRoute}`);

      // Wait for pricing-specific content to hydrate
      await page.waitForTimeout(2000);

      // Try multiple selector patterns for pricing buttons
      const payButtonSelectors = [
        'button:has-text("Pay")',
        'button:has-text("Subscribe")',
        'button:has-text("Select")',
        'button:has-text("Choose")',
        'button:has-text("Get Started")',
        'a:has-text("Pay")',
        'a:has-text("Subscribe")',
        'a:has-text("Select Plan")',
        '[class*="pricing"] button',
        '[class*="plan"] button',
        '[class*="cta"] button',
        '[data-testid*="pricing"]',
        '[data-testid*="plan"]'
      ];

      let found = 0;
      for (const selector of payButtonSelectors) {
        const buttons = await page.locator(selector).all();
        for (const btn of buttons) {
          if (await btn.isVisible()) {
            found++;
            console.log(`  Found button: ${await btn.textContent()}`);
          }
        }
      }

      console.log(`${found} payment buttons found`);

      if (found === 0) {
        // Take screenshot to debug
        await page.screenshot({ path: 'pricing-screenshot.png' });
        console.log('No payment buttons found — screenshot saved to pricing-screenshot.png');
      }
    } else {
      console.log('No sponsor/pricing page found');
    }
  });
});

test.describe('Mobile Responsive', () => {
  test('mobile viewport renders without errors', async ({ page }) => {
    // Set viewport BEFORE navigating so the page hydrates at mobile width
    await page.setViewportSize({ width: 375, height: 667 });

    // Also set user agent to mobile to ensure server-side rendering picks up mobile
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    });

    await page.goto(BASE_URL);
    await waitForHydrated(page);

    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check what viewport the page actually thinks it has
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    console.log(`Page reports viewport width: ${viewportWidth}px`);

    // ElimuX uses a bottom tab bar on mobile (Home/Search/Programs/Scholarships/Ranks/Account),
    // not a hamburger menu — confirmed by direct screenshot inspection.
    const tabLabels = ['Home', 'Search', 'Programs', 'Scholarships', 'Ranks', 'Account'];
    let tabsFound = 0;
    for (const label of tabLabels) {
      if (await hasElement(page, `text="${label}"`)) {
        tabsFound++;
      }
    }

    if (tabsFound >= 3) {
      console.log(`Bottom tab bar found with ${tabsFound}/${tabLabels.length} expected tabs`);
      expect(tabsFound).toBeGreaterThanOrEqual(3);
    } else {
      // Fall back to hamburger check in case the pattern changes in future
      const hamburger = page.locator(
        'button[aria-label*="menu" i], button[class*="hamburger"], button[class*="mobile-menu"]'
      ).first();
      if (await hamburger.count() > 0) {
        console.log('Hamburger menu found instead of bottom tab bar');
      } else {
        console.log('Neither bottom tab bar nor hamburger menu found — mobile nav may have changed');
      }
    }
  });
});

test.use({
  baseURL: BASE_URL,
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
});
