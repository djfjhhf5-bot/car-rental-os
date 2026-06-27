import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });

// First register a user and capture the onboarding page
const BASE = "http://localhost:3003";
const email = `testshot${Date.now()}@example.com`;

await page.goto(`${BASE}/register`);
await page.waitForSelector("form");
await page.fill("input[id=name]", "Test User");
await page.fill("input[id=email]", email);
await page.fill("input[id=password]", "password123");
await page.click('button[type="submit"]');
await page.waitForURL("**/onboarding", { timeout: 15000 });
await page.waitForTimeout(3000);

// Take screenshot of the onboarding page with persona questions
await page.screenshot({ path: "onboarding-persona-questions.png", fullPage: true });
console.log("Screenshot saved to onboarding-persona-questions.png");

// Verify persona questions exist
const hasFleetSize = await page.$("#fleetSize");
const hasBusinessSection = await page.$("text=Tell us about your business");
const hasChallenge = await page.$("text=Biggest Challenge");
const hasSoftware = await page.$("text=Current Software");
const hasReferral = await page.$("text=How did you find us?");

console.log(`FleetSize input: ${!!hasFleetSize}`);
console.log(`Business section heading: ${!!hasBusinessSection}`);
console.log(`Biggest Challenge select: ${!!hasChallenge}`);
console.log(`Current Software select: ${!!hasSoftware}`);
console.log(`Referral source select: ${!!hasReferral}`);

await browser.close();
