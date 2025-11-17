# Netlify Deployment Guide

## 🚀 Deploy to Netlify with Supabase

### Option 1: Using Netlify Build Variables (Recommended)

1. **Push your code to GitHub** (already done ✅)

2. **Go to Netlify Dashboard**
   - Sign in to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and authorize
   - Select your `fiszki` repository

3. **Configure Build Settings**
   - **Branch to deploy:** `supabase-integration`
   - **Build command:** (leave empty)
   - **Publish directory:** `.` (root)
   - Click "Show advanced" → "New variable"

4. **Add Environment Variables**
   
   Add these two variables:
   
   | Key | Value |
   |-----|-------|
   | `SUPABASE_URL` | `https://imohtksvibyiekyclvyd.supabase.co` |
   | `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your full key) |

5. **Deploy!**
   - Click "Deploy site"
   - Wait 1-2 minutes
   - Your app will be live at `https://[random-name].netlify.app`

### Option 2: Use netlify.toml (Alternative)

If you want to configure everything in code:

1. Create a `netlify.toml` file in your project root
2. Add environment variables in Netlify dashboard (same as above)
3. The app will automatically use them

---

## 🔧 Making Config Work on Netlify

Since Netlify is a static host, we can't use Node.js environment variables directly. We have two approaches:

### Approach A: Keep config.js and use it (Simplest - Recommended)

**Pros:** No code changes needed, works immediately  
**Cons:** Config is in code (but anon key is public anyway, so it's safe)

**Steps:**
1. Your `config.js` already has the credentials
2. Just deploy - it will work!
3. The file is in `.gitignore`, but you can create a build version

**What to do:**
```bash
# Copy config.js to a committed version for deployment
cp config.js config.prod.js
git add config.prod.js
git commit -m "Add production config for Netlify"
git push
```

Then rename it in Netlify:
- Add a build command: `cp config.prod.js config.js`

### Approach B: Dynamic config loading (More secure)

Create a new file that loads config dynamically:

**I can help you implement this if you want!** 

It involves:
1. Creating a `config-loader.js` that checks for environment variables
2. Injecting them at build time using Netlify functions
3. More complex but more secure

---

## ⚡ Quick Deploy (Easiest Way)

Since your Supabase **anon key is PUBLIC** (it's designed to be client-side), the simplest approach:

### Just commit config.js to a separate branch:

```bash
# Create a deployment branch
git checkout -b netlify-deploy
git add -f config.js  # Force add even though it's in .gitignore
git commit -m "Add config for Netlify deployment"
git push origin netlify-deploy
```

Then in Netlify:
- Deploy from `netlify-deploy` branch instead of `supabase-integration`

---

## 🔐 Security Note

Your Supabase **anon key** is:
- ✅ **Safe to expose** - It's designed for client-side use
- ✅ **Protected by RLS** - Row Level Security policies prevent unauthorized access
- ✅ **Public by design** - Even in production apps, it's in browser JavaScript

The **service_role key** is what you must NEVER expose (you're not using it).

---

## 🎯 Recommended: Simplest Deployment

1. **Create `netlify.toml`** in your project root:

```toml
[build]
  publish = "."
  
[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Commit a production config:**

```bash
cp config.js config.production.js
git add config.production.js netlify.toml
git commit -m "Add Netlify deployment configuration"
git push
```

3. **Deploy to Netlify:**
   - Import from GitHub
   - Select `supabase-integration` branch
   - It will automatically detect settings from `netlify.toml`
   - Done! 🎉

---

## ✅ After Deployment

Test your live site:
1. Visit your Netlify URL
2. Sign up with a test account
3. Create categories and words
4. Check Supabase dashboard - data should appear!
5. Test on another device - should sync!

Your flashcard app is now live on the internet! 🚀

---

## 🐛 Troubleshooting

### "config.js not found"
- Make sure you committed `config.production.js` or `config.js`
- Check Netlify deploy logs

### "Supabase connection failed"
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check browser console for errors

### Authentication not working
- Check Supabase → Authentication → URL Configuration
- Add your Netlify URL to "Site URL"
- Add to "Redirect URLs": `https://your-site.netlify.app/**`

---

Need help with any of these approaches? Let me know which one you'd like to use!
