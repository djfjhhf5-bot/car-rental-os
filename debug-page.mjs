import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 2000 } });

  await p.goto("http://localhost:3000/rent?agency=demo");
  await p.waitForTimeout(8000);

  const text = await p.locator("body").innerText();
  console.log("=== FULL PAGE TEXT ===");
  console.log(text);
  console.log("=== END ===");

  await p.screenshot({ path: "full-page.png", fullPage: true });
  await b.close();
}

main().catch(e => { console.error(e); process.exit(1); });
