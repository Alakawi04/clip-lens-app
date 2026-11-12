# ClipLens

## Local development

1. Create a free project at [Supabase](https://supabase.com/).
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project settings.
3. For a new project, run `20261020120000_initial_schema.sql` in the Supabase SQL Editor. For an existing project, also apply `20261104120000_youtube_tool_workflow.sql` and `20261105120000_credit_refunds_admin_overview_storage.sql` there, or run `npx supabase db push` after linking this folder when the earlier migrations are already tracked. The last migration adds failed-run credit refunds, the admin dashboard summary function, and storage update/delete policies.
4. Configure the email and OAuth redirect URLs in Supabase Authentication. Set the confirmation email template to include `{{ .Token }}` for the six-digit sign-up form. For Google sign-in, enable Google and add its OAuth credentials there.
5. Install dependencies with `npm install`, then run `npm run dev`.

The public image bucket is provisioned by the migration. Promote the first administrator only after that account has signed up:

```sql
update public.profiles set role = 'admin' where email = 'YOUR_ADMIN_EMAIL';
```

YouTube Data API v3 retrieves the public title, description, thumbnail, view/like/comment counts, duration, and publish date for a YouTube URL. This metadata lookup is separate from AI analysis: Manus remains the only AI provider and receives the video URL to analyze. Creator-only YouTube Studio metrics are entered manually. Set a restricted YouTube Data API v3 key as a Supabase Edge Function secret and deploy the metadata function:

```sh
npx supabase secrets set YOUTUBE_DATA_API_KEY=YOUR_GOOGLE_API_KEY
npx supabase functions deploy fetch-youtube-stats
```

ClipLens has three YouTube tools: video evaluation, title and description generation, and thumbnail generation. They share one private analysis record per video and show up as a single item in the owner’s History, available from the profile menu. Evaluation costs 2 credits, title and description generation costs 1 credit, and thumbnail generation costs 3 credits by default; administrators can change these amounts in billing settings. The evaluation report focuses on video quality and performance, while title generation and image generation run as their own tools. Video access varies; when Manus cannot inspect the full video, it must state that limit and base the report only on evidence it can access.

Manus runs each request as a private background task; ClipLens polls the task and saves its structured report or generated image when ready. Set its key as a Supabase Edge Function secret and deploy the three Manus functions:

```sh
npx supabase secrets set MANUS_API_KEY=YOUR_MANUS_API_KEY
npx supabase functions deploy analyze-youtube-video
npx supabase functions deploy generate-thumbnail
npx supabase functions deploy manus-task-status
```

Production function secrets belong to the Supabase project used by `VITE_SUPABASE_URL`; adding `MANUS_API_KEY` to GitHub Actions secrets or the Vite `.env.local` does not provide it to a remote Edge Function. Supabase applies a production secret to functions immediately, so redeploy only when the function code changes.

YouTube Studio’s private impressions and CTR are not fetched automatically; the user can enter them manually. Manus returns a structured report in the selected video language, and the summary follows the interface language. The Manus key stays on Supabase and is never sent to the browser.

Thumbnail generation runs only when requested from the Thumbnail tool and creates a 16:9 image in the existing public `public-assets` bucket. For YouTube links, Manus receives the exact URL and may also use the supplied thumbnail and reference images. Manus tasks are private by default and start without user-connected account connectors. Review Manus account usage and data terms before sharing real customer videos. Do not put the Manus key in `.env.local`, a `VITE_*` variable, browser code, or a committed file.

Keep all API and Supabase secret keys in server-side secrets only: never put them in a `VITE_*` variable or browser code. For local Edge Function development, use a local Supabase env file that is excluded from Git.

## Credits and Pro billing

The billing migrations enable credits by default: new accounts receive 3 credits, video evaluation costs 2 credits, title and description generation costs 1 credit, and thumbnail generation costs 3 credits. Pro is a $20 monthly subscription that grants 200 credits per paid billing period. Credit reservations are enforced by Supabase before a Manus task starts; Stripe webhook events are signature-verified and idempotent.

Apply the migration and deploy the billing functions:

```sh
npx supabase db push
npx supabase functions deploy create-credit-checkout
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

Configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `SITE_URL` in Supabase Edge Function secrets. Add a Stripe webhook endpoint at `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` for `checkout.session.completed`, `invoice.paid`, and `customer.subscription.deleted`. Do not put payment or AI provider secrets in frontend environment variables.

## Free hosting

Deploy the frontend to [Cloudflare Pages](https://pages.cloudflare.com/) on its free plan. Use `npm run build` as the build command and `dist` as the output directory. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Pages environment, and use a single-page-app fallback so routes resolve to `index.html`.

Free plans have usage limits and may change. Existing passwords cannot be transferred from the former authentication provider, so users will need to register again. Export and import existing records separately before switching production traffic.
