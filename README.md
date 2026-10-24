# ClipLens

## Local development

1. Create a free project at [Supabase](https://supabase.com/).
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project settings.
3. Run the SQL migration in `supabase/migrations/20261020120000_initial_schema.sql` using the Supabase SQL Editor.
4. Configure the email and OAuth redirect URLs in Supabase Authentication. Set the confirmation email template to include `{{ .Token }}` for the six-digit sign-up form. For Google sign-in, enable Google and add its OAuth credentials there.
5. Install dependencies with `npm install`, then run `npm run dev`.

The public image bucket is provisioned by the migration. Promote the first administrator only after that account has signed up:

```sql
update public.profiles set role = 'admin' where email = 'YOUR_ADMIN_EMAIL';
```

Deploy YouTube metadata retrieval as a Supabase Edge Function:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID
npx supabase secrets set YOUTUBE_DATA_API_KEY=YOUR_GOOGLE_API_KEY
npx supabase functions deploy fetch-youtube-stats
```

The function runs on Supabase Edge and has its Supabase environment provided by the platform; this Vite project does not need `@supabase/server`. JWT verification is enabled for the function in `supabase/config.toml`. Keep all API and Supabase secret keys in server-side secrets only: never put them in a `VITE_*` variable or browser code.

Gemini handles video analysis and title suggestions only. Save its key as a Supabase Edge Function secret, then deploy the analysis function:

```sh
npx supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
npx supabase functions deploy analyze-youtube-video
```

YouTube reviews use the public thumbnail/title and public details from YouTube Data API, plus the Studio metrics the user enters manually. YouTube Studio’s private impressions and CTR are not fetched automatically. Gemini returns the analysis, up to five alternative titles with reasons, and a thumbnail concept in the selected video language; the summary follows the interface language. It uses `gemini-3.5-flash-lite` through Google’s `generateContent` API. MP4 analysis sends six sampled still frames and the supplied context; it does not inspect audio or claim to watch every frame.

After a successful text analysis, ClipLens automatically creates one thumbnail image and saves it to the existing public `public-assets` bucket and the user’s analysis record. The results page also lets users generate another version. It calls the FLUX Kontext Pro API through FluxAPI.ai from the `generate-thumbnail` Edge Function, polls the returned task ID, then downloads and saves the completed image. The requested image ratio is 16:9. For uploaded MP4s, four sampled video frames are composed into a temporary reference image and passed to FLUX to preserve visible people and objects; YouTube-link analyses can use up to four screenshots the user selects. This reference is stored in a private temporary bucket, passed using a time-limited signed URL, then deleted after the image task finishes. Local frame samples remain on the device for up to 24 hours for thumbnail regeneration. The public YouTube thumbnail is not sent to the image service. Each generated image may consume FluxAPI account credits; usage is not unlimited. The app never sends the API key to the browser.

Create an API key in the [FluxAPI.ai dashboard](https://fluxapi.ai/). This project uses the Flux Kontext Pro endpoint, not the Black Forest Labs direct API. FluxAPI.ai uses account credits and may offer trial credits; usage is not unlimited. Check your current credits and model pricing in its dashboard before generating images. Add the key as a server-side Supabase secret:

```sh
npx supabase secrets set IMAGE_API_KEY=YOUR_FLUXAPI_AI_API_KEY
npx supabase functions deploy generate-thumbnail
```

YouTube metadata lookup uses `YOUTUBE_DATA_API_KEY` and is deployed separately as described above. It reads public video details only. Set all three provider keys in **Supabase Dashboard → Edge Functions → Secrets**, or with the CLI commands above. For local Edge Function development, use a local Supabase env file that is excluded from Git. Never put these values in `.env.local`, `VITE_*`, browser code, or a committed file.

The existing analysis RLS policy is checked before image generation and when saving results. Generated images are stored in the existing public image bucket under a path scoped to the authenticated user and analysis. A private `thumbnail-reference-temp` Storage bucket is provisioned by the new migration for temporary reference images; only the Edge Function service role can access it.

Apply pending migrations and deploy the updated image function:

```sh
npx supabase db push
npx supabase functions deploy generate-thumbnail
```

Gemini’s free tier has usage limits, and Google states that free-tier inputs may be used to improve its products. If that is not suitable for submitted video frames or Studio data, use a paid Gemini tier with its separate pricing and data terms. Keep provider secrets out of all `VITE_*` variables.

Create the YouTube key in [Google Cloud Console](https://console.cloud.google.com/), enable YouTube Data API v3, and restrict the key to that API. YouTube API usage has a quota; check the project quota before increasing traffic. The function retrieves public video metadata only; private YouTube Studio metrics such as impressions and CTR must be provided by the user. Create the Gemini key in [Google AI Studio](https://aistudio.google.com/apikey); it is used by the Edge Function for analysis only.

## Credits and Pro billing

The billing migration enables credits by default: new accounts receive 3 credits, a YouTube link analysis costs 1 credit, and an uploaded-video analysis costs 2. Pro is a $20 monthly subscription that grants 200 credits per paid billing period. Credit reservations are enforced by Supabase before a YouTube model request; Stripe webhook events are signature-verified and idempotent.

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
