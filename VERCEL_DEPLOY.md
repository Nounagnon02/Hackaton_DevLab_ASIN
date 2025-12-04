# Vercel Configuration for BioPension

## Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=your_postgres_connection_string
OPENAI_API_KEY=your_google_api_key
OPENAI_MODEL_NAME=gemini-1.5-flash
MOJALOOP_BASE_URL=http://localhost:4040
```

## Database

You need a PostgreSQL database. Options:

### Option 1: Vercel Postgres (Recommended - Free Tier)
1. Go to Vercel Dashboard → Storage → Create Database → Postgres
2. Copy the generated `DATABASE_URL`
3. Add to Environment Variables

### Option 2: Neon.tech (Free Tier)
1. Create account at https://neon.tech
2. Create database
3. Copy connection string
4. Add as `DATABASE_URL` in Vercel

### Option 3: Supabase (Free Tier)
1. Create project at https://supabase.com
2. Get PostgreSQL connection string
3. Add as `DATABASE_URL` in Vercel

## Deployment Commands

Vercel automatically runs:
```bash
npm install          # Install dependencies
npm run postinstall  # Generates Prisma Client
npm run vercel-build # Prisma generate + db push + Next.js build
```

## First Deployment

```bash
# Commit your changes
git commit -m "Configure for Vercel deployment"
git push -u origin main

# Deploy
npm install -g vercel
vercel --prod
```

## Database Seeding

After first deployment, seed the database:

```bash
# Connect to your production database
vercel env pull .env.production

# Run seed with production env
DATABASE_URL=your_production_url npm run prisma db seed
```

## Notes

- `prisma db push` creates tables automatically on deployment
- No migrations needed for hackathon
- Database schema updates on every deploy
