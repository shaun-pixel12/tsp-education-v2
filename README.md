# TSP-education Search Platform

Semiconductor post-fab education and seminar recommendation app for TSP users.

## Structure

```text
web/       Static app deployed by Vercel
crawler/   Seed and staging pipeline for future crawling automation
.github/   Manual workflow for refreshing crawler staging data
```

## Local Preview

```powershell
node scripts/local-preview-server.mjs
```

Then open:

```text
http://localhost:5000/
```

## Vercel Settings

When importing this repository into Vercel:

```text
Framework Preset: Other
Root Directory: web
Build Command: leave empty
Output Directory: .
```

The repository also includes `vercel.json`, so it can still serve the `web`
static app if Vercel is imported with the repository root as the root directory.

## Future Crawling Plan

The current app ships with curated TSP post-fab education/event seed data.
Future crawling can extend `crawler/scraper.js` to visit the URLs in
`crawler/crawler_sources.json`, generate reviewed candidates in
`crawler/staging_courses.json`, and then update the app data after review.
