import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function main() {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  let passed = 0, failed = 0;

  await p.goto(BASE);
  await p.waitForTimeout(3000);

  async function closeModal() {
    const modal = p.locator(".fixed.inset-0.z-50");
    if (await modal.isVisible().catch(() => false)) {
      const closeBtn = modal.locator("button");
      if (await closeBtn.count() > 0) {
        await closeBtn.first().click();
      } else {
        await p.keyboard.press("Escape");
      }
      await p.waitForTimeout(500);
    }
  }

  async function ensureEnglish() {
    const enBtn = p.locator("button:has-text('🇬🇧')");
    if (await enBtn.isVisible().catch(() => false)) {
      await enBtn.click();
      await p.waitForTimeout(500);
    }
  }

  async function test(name, fn) {
    try { await fn(); console.log(`  ✅ ${name}`); passed++; }
    catch (e) { console.log(`  ❌ ${name}: ${e.message}`); failed++; }
  }

  console.log("\n=== FULL E2E TEST ===\n");

  await test("1. Rent page shows Inquire buttons", async () => {
    await p.goto(`${BASE}/rent?agency=demo`);
    await p.waitForTimeout(8000);
    const count = await p.locator("button:has-text('Inquire')").count();
    if (count < 1) throw new Error(`Expected >=1, got ${count}`);
    console.log(`    ${count} cars with Inquire button`);
  });

  await test("2. Nav has Inquire link", async () => {
    const navText = (await p.locator('nav').innerText()).toLowerCase();
    if (!navText.includes('inquire'))
      throw new Error('Inquire not found in nav');
    console.log('    Nav has Inquire link');
  });

  await test("3. Arabic shows استفسار + nav has استفسر", async () => {
    await p.locator("button:has-text('🇸🇦')").click();
    await p.waitForTimeout(1500);
    const count = await p.locator("button:has-text('استفسار')").count();
    if (count < 1) throw new Error(`Expected >=1 استفسار, got ${count}`);
    const navAr = await p.locator('nav').innerText();
    if (!navAr.includes('استفسر'))
      throw new Error('Nav missing استفسر');
    console.log(`    ${count} استفسار buttons, nav has استفسر`);
  });

  await test("4. Language persists after reload", async () => {
    await p.reload();
    await p.waitForTimeout(8000);
    const count = await p.locator("button:has-text('استفسار')").count();
    if (count < 1) throw new Error(`Language reset`);
  });

  await test("5. Open modal with car details", async () => {
    await p.locator("button:has-text('استفسار')").first().click();
    await p.waitForTimeout(1000);
    if (!await p.getByPlaceholder("اسمك").isVisible())
      throw new Error("Form not visible");
  });

  await test("6. Submit inquiry in Arabic", async () => {
    const uid = Date.now();
    await p.getByPlaceholder("اسمك").fill(`اختبار ${uid}`);
    await p.getByPlaceholder("+213").fill(`+213-555-${uid % 10000}`);
    await p.locator('input[type="date"]').first().fill("2025-09-01");
    await p.locator('input[type="date"]').nth(1).fill("2025-09-05");
    await p.getByRole("button", { name: "إرسال الاستفسار" }).click();
    await p.waitForTimeout(2500);
    if (!await p.locator("text=بنجاح").isVisible())
      throw new Error("Success not shown");
    await closeModal();
  });

  await test("7. Submit inquiry in English", async () => {
    await ensureEnglish();
    await p.waitForTimeout(500);
    await p.locator("button:has-text('Inquire')").first().click();
    await p.waitForTimeout(1000);
    const uid = Date.now();
    await p.getByPlaceholder("Your name").fill(`English Test ${uid}`);
    await p.getByPlaceholder("+213").fill(`+213-555-${uid % 10000}`);
    await p.locator('input[type="date"]').first().fill("2025-11-01");
    await p.locator('input[type="date"]').nth(1).fill("2025-11-05");
    await p.getByRole("button", { name: "Submit Inquiry" }).click();
    await p.waitForTimeout(2500);
    if (!await p.locator("text=successfully").isVisible())
      throw new Error("Success not shown");
    await closeModal();
  });

  await test("8. Login and check dashboard with Recent Inquiries", async () => {
    await p.goto(`${BASE}/login`);
    await p.waitForTimeout(1000);
    await p.locator("#email").fill("admin@demo.com");
    await p.locator("#password").fill("password123");
    await p.locator("form").evaluate(form => form.requestSubmit());
    await p.waitForTimeout(3000);

    await p.goto(`${BASE}/dashboard`);
    await p.waitForTimeout(5000);
    if (p.url().includes("/login"))
      throw new Error("Login failed");

    const text = await p.locator("body").innerText();
    if (!text.includes("Lead Pipeline"))
      throw new Error("Lead Pipeline not found");
    if (!text.includes("Recent Inquiries"))
      throw new Error("Recent Inquiries card not found");
    console.log('    Dashboard shows Lead Pipeline + Recent Inquiries');
  });

  await test("9. Leads page shows submissions", async () => {
    await p.goto(`${BASE}/leads`);
    await p.waitForTimeout(4000);
    const text = await p.locator("body").innerText();
    if (!text.includes("English Test") && !text.includes("اختبار"))
      throw new Error("Submitted leads not found");
    console.log('    Submitted leads visible');
  });

  console.log(`\n=== ${passed}/${passed + failed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
  await b.close();
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
