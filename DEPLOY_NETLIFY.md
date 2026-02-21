# Deploy On Netlify

## Option 1: Fastest (Drag and Drop)
1. Go to `https://app.netlify.com/drop`
2. Drag the whole project folder and drop it.
3. Netlify publishes instantly and gives you a live URL.

## Option 2: Professional (Git Auto Deploy)
1. Push this project to GitHub.
2. In Netlify: `Add new site` -> `Import an existing project`.
3. Select your GitHub repo.
4. Build settings:
   - `Build command`: leave empty
   - `Publish directory`: `.`
5. Click `Deploy site`.

## Production Notes
- `netlify.toml` is already configured for:
  - security headers
  - browser caching strategy
  - static-site publish from root folder

## Custom Domain
1. Netlify -> `Site settings` -> `Domain management`.
2. Add your custom domain.
3. Enable HTTPS (Netlify SSL) and force HTTPS.
