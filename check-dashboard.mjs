import { chromium } from "playwright";

async function check() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Step 1: Submit an order as a guest
  await page.goto("http://localhost:3000/rent?agency=demo");
  await page.waitForSelector("button:has-text('Inquire')", { timeout: 15000 });
  await page.locator("button:has-text('Inquire')").first().click();
  await page.waitForTimeout(500);
  await page.getByPlaceholder("Your name").fill("Angry User Test");
  await page.getByPlaceholder("+213").fill("+213-555-9999");
  await page.locator('input[type="date"]').first().fill("2025-07-10");
  await page.locator('input[type="date"]').nth(1).fill("2025-07-15");
  await page.getByRole("button", { name: "Submit Inquiry" }).click();
  await page.waitForTimeout(2000);

  // Step 2: Login as admin
  await page.goto("http://localhost:3000/login");
  await page.waitForTimeout(1000);
  await page.locator('input[type="email"]').fill("admin@demo.com");
  await page.locator('input[type="password"]').fill("password123");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);

  // Step 3: Screenshot the dashboard
  const url = page.url();
  console.log(`Login result URL: ${url}`);
  
  // If still on login, try navigating directly
  if (url.includes("/login")) {
    console.log("Login didn't redirect, checking for error...");
    const pageText = await page.locator("body").innerText();
    const errorLine = pageText.split("\n").filter(l => l.includes("error") || l.includes("Error") || l.includes("Email") || l.includes("Password"))[0];
    console.log(`  Page text snippet: ${errorLine || "N/A"}`);
    
    // Force navigate to dashboard
    await page.goto("http://localhost:3000/dashboard");
    await page.waitForTimeout(3000);
    console.log(`Dashboard URL after force nav: ${page.url()}`);
  }

  await page.screenshot({ path: "dashboard-check.png", fullPage: true });
  console.log("Dashboard screenshot saved to dashboard-check.png");

  // Step 4: Screenshot leads page
  await page.goto("http://localhost:3000/leads");
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "leads-check.png", fullPage: true });
  console.log("Leads screenshot saved to leads-check.png");

  // Step 5: Take rent page screenshot in Arabic
  await page.goto("http://localhost:3000/rent?agency=demo");
  await page.waitForTimeout(3000);
  // Switch to Arabic
  await page.locator("button:has-text('🇸🇦')").click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "rent-arabic.png", fullPage: true });
  console.log("Arabic rent page screenshot saved to rent-arabic.png");

  // Step 6: Take rent page screenshot in English
  await page.locator("button:has-text('🇬🇧')").click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "rent-english.png", fullPage: true });
  console.log("English rent page screenshot saved to rent-english.png");

  await browser.close();
  console.log("\nDone - check the screenshots");
}

check();
