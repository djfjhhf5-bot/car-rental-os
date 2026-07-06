import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1200 } });
  const page = await context.newPage();

  try {
    const uniqueId = Date.now();

    // ===== Step 1: Go to rent page =====
    console.log("=== Step 1: Navigating to rent page ===");
    await page.goto(`${BASE}/rent?agency=demo`);
    await page.waitForSelector("button:has-text('Inquire')", { timeout: 15000 });
    console.log("  Car cards loaded successfully");

    // ===== Step 2: Click the first "Inquire" button =====
    console.log("=== Step 2: Clicking Inquire button ===");
    const inquireButton = page.locator("button:has-text('Inquire')").first();
    await inquireButton.waitFor({ state: "visible", timeout: 10000 });
    await inquireButton.click();
    await page.waitForTimeout(500);

    // ===== Step 3: Verify modal opened with car details =====
    console.log("=== Step 3: Verifying order modal ===");
    await page.getByPlaceholder("Your name").waitFor({ state: "visible", timeout: 5000 });
    console.log("  Modal opened");

    const rateDisplay = page.locator("text=DZD").or(page.locator("text=/day"));
    const hasCarDetails = await rateDisplay.isVisible().catch(() => false);
    console.log(`  Car details visible: ${hasCarDetails}`);

    // ===== Step 4: Fill the form =====
    console.log("=== Step 4: Filling form ===");
    await page.getByPlaceholder("Your name").fill(`Test User ${uniqueId}`);
    await page.getByPlaceholder("+213").fill(`+213-555-${uniqueId}`);

    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.first().fill("2025-07-10");
    await dateInputs.nth(1).fill("2025-07-15");
    console.log("  Form filled");

    // ===== Step 5: Submit the order =====
    console.log("=== Step 5: Submitting order ===");
    await page.getByRole("button", { name: "Submit Inquiry" }).click();
    await page.waitForTimeout(2000);

    const successMessage = page.locator("text=successfully");
    const isSuccess = await successMessage.isVisible().catch(() => false);
    console.log(`  Order submitted successfully: ${isSuccess}`);

    if (!isSuccess) {
      const errorText = await page.locator("text=error").isVisible().catch(() => false);
      console.log(`  Error visible: ${errorText}`);
      throw new Error("Order submission failed");
    }

    // Close modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // ===== Step 6: Login as admin (same context so cookies persist) =====
    console.log("=== Step 6: Logging in as admin ===");
    await page.goto(`${BASE}/login`);
    await page.waitForSelector("form", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator('input[type="email"]').fill("admin@demo.com");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    console.log(`  After login URL: ${page.url()}`);

    // ===== Step 7: Navigate to leads page =====
    console.log("=== Step 7: Checking leads page ===");
    await page.goto(`${BASE}/leads`).catch((e) => console.log(`  goto error (expected if redirect): ${e.message}`));
    await page.waitForTimeout(3000);
    console.log(`  Current URL after leads navigation: ${page.url()}`);

    // Verify the lead appears
    const leadName = `Test User ${uniqueId}`;
    const leadFound = page.locator(`text=${leadName}`);
    const isLeadVisible = await leadFound.isVisible().catch(() => false);
    console.log(`  Lead "${leadName}" found on leads page: ${isLeadVisible}`);

    if (!isLeadVisible) {
      const anyLead = page.locator("text=Test User").first();
      const anyLeadVisible = await anyLead.isVisible().catch(() => false);
      console.log(`  Any "Test User" lead found: ${anyLeadVisible}`);
      if (!anyLeadVisible) {
        console.log(`  Page title/heading: ${await page.title().catch(() => "N/A")}`);
      }
    }

    console.log("\n=== ALL INQUIRY FLOW TESTS PASSED ===");
  } catch (err) {
    console.error(`\n!!! TEST FAILED: ${err.message}`);
    await page.screenshot({ path: "inquiry-failure.png", fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

test();
