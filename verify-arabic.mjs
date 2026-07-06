import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 2000 } });

  // Navigate to rent page with Arabic language (set via localStorage)
  await p.goto("http://localhost:3000/rent?agency=demo");
  await p.waitForTimeout(4000);

  // Switch to Arabic
  await p.evaluate(() => {
    localStorage.setItem("lang", "ar");
    window.location.reload();
  });
  await p.waitForTimeout(4000);

  // Take screenshot
  await p.screenshot({ path: "rent-arabic-final.png", fullPage: true });
  
  // Verify button text
  const btnTexts = await p.locator("button").allTextContents();
  const arBtns = btnTexts.filter(t => t.trim() === "استفسار");
  console.log(`"استفسار" buttons found: ${arBtns.length}`);

  // Test inquiry flow in Arabic
  await p.locator("button:has-text('استفسار')").first().click();
  await p.waitForTimeout(700);
  console.log("Modal opened:", await p.getByPlaceholder("اسمك").isVisible());

  await b.close();
}

main().catch(e => { console.error(e); process.exit(1); });
