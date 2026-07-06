import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Submit inquiry from rent page
  await page.goto("http://localhost:3000/rent?agency=demo");
  await page.waitForSelector("button:has-text('Inquire')", { timeout: 15000 });
  await page.locator("button:has-text('Inquire')").first().click();
  await page.waitForTimeout(700);
  await page.getByPlaceholder("Your name").fill("Dashboard Test User");
  await page.getByPlaceholder("+213").fill("+213-555-1234");
  await page.locator('input[type="date"]').first().fill("2025-08-01");
  await page.locator('input[type="date"]').nth(1).fill("2025-08-05");
  await page.getByRole("button", { name: "Submit Inquiry" }).click();
  await page.waitForTimeout(2000);
  console.log("Inquiry submitted");

  // 2. Login
  await page.goto("http://localhost:3000/login");
  await page.waitForTimeout(1000);
  await page.locator("#email").fill("admin@demo.com");
  await page.locator("#password").fill("password123");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);

  // 3. Go to dashboard (session should be set)
  await page.goto("http://localhost:3000/dashboard");
  await page.waitForTimeout(3000);

  // Get dashboard text content
  const bodyText = await page.locator("body").innerText();
  const lines = bodyText.split("\n").filter(l => l.trim());
  console.log("\n=== DASHBOARD CONTENT ===");
  // Show lines related to leads/inquiries
  lines.filter(l => l.toLowerCase().includes("lead") || l.toLowerCase().includes("inquiry") || l.toLowerCase().includes("pipeline")).forEach(l => console.log(`  ${l.trim()}`));
  console.log("Total lines:", lines.length);

  // 4. Go to leads page
  await page.goto("http://localhost:3000/leads");
  await page.waitForTimeout(3000);
  const leadsText = await page.locator("body").innerText();
  const leadLines = leadsText.split("\n").filter(l => l.trim());
  console.log("\n=== LEADS PAGE ===");
  leadLines.filter(l => l.includes("Dashboard Test") || l.includes("Test User") || l.includes("inquiry")).slice(0, 10).forEach(l => console.log(`  ${l.trim()}`));

  await page.screenshot({ path: "final-dashboard.png", fullPage: true });
  await page.screenshot({ path: "final-leads.png", fullPage: true });

  await browser.close();
  console.log("\nScreenshots saved");
}

main();
