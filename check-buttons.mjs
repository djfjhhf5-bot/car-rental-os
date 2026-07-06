import { chromium } from "playwright";

async function check() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  await page.goto("http://localhost:3000/rent?agency=demo");
  await page.waitForTimeout(5000);

  // Check all buttons on the page
  const buttons = await page.locator("button").all();
  console.log(`Total buttons: ${buttons.length}`);
  for (const btn of buttons) {
    const text = await btn.textContent();
    console.log(`  Button: "${text?.trim()}"`);
  }

  // Check for inquire/inquiry buttons specifically
  const inquire = page.locator("button:has-text('Inquire')");
  const inquireCount = await inquire.count();
  console.log(`\n"Inquire" buttons found: ${inquireCount}`);

  const istfsr = page.locator("button:has-text('استفسار')");
  const istfsrCount = await istfsr.count();
  console.log(`"استفسار" buttons found: ${istfsrCount}`);

  await page.screenshot({ path: "rent-page-check.png", fullPage: true });
  console.log("\nScreenshot saved to rent-page-check.png");

  await browser.close();
}

check();
