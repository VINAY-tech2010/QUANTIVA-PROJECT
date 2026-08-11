This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Configuration

Copy `.env.example` to `.env.local` and fill in the values you need. Nothing is
required for the calculators to work locally — every integration degrades
gracefully when its variables are unset.

### Currency / FX

| Variable | Description |
| --- | --- |
| `FX_PROVIDER` | FX rates provider. |
| `FX_CACHE_TTL_SECONDS` | How long to cache FX rates. |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for SEO canonical/OG tags and the sitemap. |

### Feedback / contact email delivery (server-side only)

The contact, complaint, and feedback form at `/improvement` delivers real email
to the owner inbox. Until these are set, the API returns a clear
"currently unavailable" response instead of a fake success.

| Variable | Description |
| --- | --- |
| `FEEDBACK_TO_EMAIL` | **Required.** Owner inbox that receives messages. |
| `FEEDBACK_FROM_EMAIL` | Sender address (provider-dependent; verified domain for Resend). |
| `EMAIL_PROVIDER` | `resend` or `smtp-webhook` (default). |
| `EMAIL_PROVIDER_API_KEY` | API key for the chosen provider. Server-side secret. |
| `FEEDBACK_SMTP_URL` | Webhook endpoint for `smtp-webhook`. Receives a JSON POST `{ to, from, subject, text, html, replyTo }`. |

### Advertising (Google AdSense) — public values

Ad slots render as graceful placeholders (no network calls) until these are set.
These are public by design and use the `NEXT_PUBLIC_` prefix.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense publisher/client ID, e.g. `ca-pub-…`. |
| `NEXT_PUBLIC_ADSENSE_SLOT_TOP` | Ad-unit slot below the page header. |
| `NEXT_PUBLIC_ADSENSE_SLOT_RAIL` | Ad-unit slot for the desktop rail beside a calculator. |
| `NEXT_PUBLIC_ADSENSE_SLOT_INCONTENT` | Ad-unit slot between content sections. |
| `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR` | Ad-unit slot for a desktop sidebar placement. |
| `NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM` | Ad-unit slot after results/explanation. |
| `NEXT_PUBLIC_ADSENSE_SLOT_FOOTER` | Ad-unit slot above the footer. |

The site is **AdSense-ready**: it renders clean, space-reserving placeholders
until you add the real client/slot IDs. Once configured, ads activate
automatically with no code changes. (AdSense requires the site to be added and
approved in your AdSense account before ads serve.)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
