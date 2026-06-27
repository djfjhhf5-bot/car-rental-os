import { chromium } from "playwright";

const BASE = "http://localhost:3003";

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });

  try {
    const uniqueId = Date.now();
    const email = `test${uniqueId}@example.com`;

    // Register
    await page.goto(`${BASE}/register`);
    await page.waitForSelector("form");
    await page.fill("input[id=name]", "Test User");
    await page.fill("input[id=email]", email);
    await page.fill("input[id=password]", "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/onboarding", { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Verify persona question section renders
    const hasSection = await page.$("text=Tell us about your business");
    const hasFleet = await page.$("#fleetSize");
    const hasChallengeCheckbox = await page.$("button[role=checkbox]");
    const hasChallengeOther = await page.$("#challengeOther");
    const hasSoftwareOther = await page.$("#softwareOther");
    const hasReferralOther = await page.$("#referralOther");

    console.log(`Tell us about your business heading: ${!!hasSection}`);
    console.log(`Fleet size input: ${!!hasFleet}`);
    console.log(`Checkboxes rendered: ${!!hasChallengeCheckbox}`);
    console.log(`Challenge other text input: ${!!hasChallengeOther}`);
    console.log(`Software other text input: ${!!hasSoftwareOther}`);
    console.log(`Referral other text input: ${!!hasReferralOther}`);

    if (!hasSection || !hasFleet || !hasChallengeCheckbox) {
      throw new Error("Persona questions not rendering correctly");
    }

    // Click checkboxes
    const checkboxes = await page.$$("button[role=checkbox]");
    console.log(`Total checkbox elements found: ${checkboxes.length}`);
    if (checkboxes.length >= 2) {
      await checkboxes[0].click();
      await checkboxes[1].click();
      console.log("  Clicked 2 checkboxes");
    }

    // Fill other text
    await page.fill("#challengeOther", "Staff scheduling");
    await page.fill("#softwareOther", "Custom dashboard");
    await page.fill("#referralOther", "LinkedIn ad");

    // Fill agency basics
    await page.fill("input[id=name]", "Test Agency");
    await page.fill("input[id=phone]", "+213 555-123-456");
    await page.fill("input[id=address]", "123 Test St");
    await page.fill("input[id=fleetSize]", "10");
    await page.fill("input[id=yearsInBusiness]", "5");
    await page.fill("input[id=monthlyBookings]", "30");

    // Submit
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(2000);

    // Vehicle step
    const vehicle = await page.$("text=Add Your First Vehicle");
    console.log(`\nVehicle step reached: ${!!vehicle}`);
    await page.fill("input[id=brand]", "Toyota");
    await page.fill("input[id=model]", "Corolla");
    await page.fill("input[id=year]", "2025");
    await page.fill("input[id=plate]", "ABC-1234");
    await page.fill("input[id=rate]", "5000");
    await page.click('button:has-text("Add Vehicle")');
    await page.waitForTimeout(1500);

    // AI Intro
    await page.click('button:has-text("Start Using CarRental OS")');
    await page.waitForTimeout(3000);

    // Done -> Dashboard
    await page.click('button:has-text("Go to Dashboard")');
    await page.waitForTimeout(2000);

    const url = page.url();
    console.log(`\nFinal URL: ${url}`);
    if (url.includes("/onboarding")) throw new Error("Session refresh failed!");
    
    const sidebar = await page.$("text=Fleet");
    console.log(`Dashboard sidebar: ${!!sidebar}`);

    console.log("\n=== ALL E2E TESTS PASSED ===");
  } catch (err) {
    console.error(`\n!!! TEST FAILED: ${err.message}`);
    await page.screenshot({ path: "e2e-failure.png", fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

test();
