import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  
  // Listen for console errors
  const errors = [];
  p.on("pageerror", err => errors.push(err.message));
  p.on("console", msg => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  
  await p.goto("http://localhost:3000/rent?agency=demo");
  await p.waitForTimeout(10000);
  
  const text = await p.locator("body").innerText();
  console.log("=== FULL PAGE TEXT ===");
  console.log(text);
  console.log("=== END ===");
  
  if (errors.length > 0) {
    console.log("\n=== ERRORS ===");
    errors.forEach(e => console.log("  ", e));
  }
  
  // Check HTML for key elements
  const html = await p.locator("html").innerHTML();
  const hasSkeleton = html.includes("animate-pulse");
  const hasCarCards = html.includes("Inquire") || html.includes("استفسار");
  console.log(`\nHas skeleton loaders: ${hasSkeleton}`);
  console.log(`Has car cards: ${hasCarCards}`);
  
  await b.close();
}

main().catch(e => { console.error(e); process.exit(1); });
