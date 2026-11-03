# Screenshots pending

No PNGs are included because the app could not be built or run with its required dependencies in the authoring environment. Mock screenshots would not demonstrate the real dashboard.

After `npm install` and a successful `npm test && npm run build`:

```bash
npx playwright install chromium
npm run screenshots
```

This produces one 1920×1080 PNG per page plus a dark-theme example, then verifies projector/mobile layouts. Inspect the images before using them in the written report and commit the generated files.
