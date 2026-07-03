# Admin Central — Forge Deployment

## 1. Create GitHub repo

In Git Bash inside `admin-central/`:

```bash
git init
git add .
git commit -m "Admin Central MVP — Next.js 14"
git remote add origin git@github.com:Bpavlov3c/silvernoise-admin.git
git branch -M main
git push -u origin main
```

(Create the `silvernoise-admin` repo on GitHub first — private is fine.)

## 2. Add Forge site

In Forge → Server → Sites → Add Site:
- **Type**: JavaScript
- **Framework**: Next.js
- **Domain**: `silvernoise-admin.on-forge.com` (or your internal domain)
- **Port**: `3001`
- **Repository**: `Bpavlov3c/silvernoise-admin`
- **Branch**: `main`

## 3. Environment variable

In Forge → Site → Environment:

```env
NEXT_PUBLIC_API_URL=https://silvernoise-api.on-forge.com/api
```

## 4. Deployment script

Paste into Forge → Site → Deployment → Script:

```bash
cd $FORGE_SITE_PATH
git pull origin main
npm ci
npm run build
```

## 5. Start command (Forge Daemon)

In Forge → Site → Daemons or the process config, set:

```bash
npm start
```

This runs `next start -p 3001` as defined in package.json.

## 6. Test

Visit `http://silvernoise-admin.on-forge.com/login` — you should see the login screen.
Login with the admin credentials you set in the previous session.
