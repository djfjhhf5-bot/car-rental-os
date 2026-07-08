<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:critical-rules -->
# CRITICAL: DO NOT BREAK THE APP

## Test everything on browser before finishing
After ANY change, you MUST:
1. Open the deployed app in a browser
2. Test login with `admin@demo.com` / `password123`
3. Test the dashboard loads
4. Test settings page
5. Test AI chat
6. Test the public store page
7. Only then mark the task as done

## NEVER modify these files without explicit user request:
- `src/lib/auth-config.ts` — touched this before and broke sessions
- Database seed / schema after deployment

## If unsure about a change, ask the user first.
<!-- END:critical-rules -->
