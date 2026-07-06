import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();

  // Test 1: English mode - check for "Inquire" button
  await p.goto("http://localhost:3000/rent?agency=demo");
  await p.waitForTimeout(5000);
  const enBtns = await p.locator("button:has-text('Inquire')").count();
  console.log(`"Inquire" buttons (English): ${enBtns}`);

  // Test 2: Switch to Arabic
  await p.locator("button:has-text('🇸🇦')").click();
  await p.waitForTimeout(1000);
  const arBtns = await p.locator("button:has-text('استفسار')").count();
  console.log(`"استفسار" buttons (Arabic): ${arBtns}`);

  // Test 3: Submit inquiry
  await p.locator("button:has-text('استفسار')").first().click();
  await p.waitForTimeout(700);
  const nameInput = await p.getByPlaceholder("اسمك").isVisible();
  console.log(`Modal opens with Arabic form: ${nameInput}`);

  await p.getByPlaceholder("اسمك").fill("مستخدم جديد");
  await p.getByPlaceholder("+213").fill("+213-555-7777");
  await p.locator('input[type="date"]').first().fill("2025-09-01");
  await p.locator('input[type="date"]').nth(1).fill("2025-09-05");
  await p.getByRole("button", { name: "إرسال الاستفسار" }).click();
  await p.waitForTimeout(2000);
  const success = await p.locator("text=بنجاح").isVisible();
  console.log(`Inquiry submitted successfully: ${success}`);

  await p.screenshot({ path: "final-verified.png", fullPage: true });
  await b.close();
}

main().catch(e => { console.error(e); process.exit(1); });
