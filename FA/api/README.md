# API – Vercel serverless

## /api/send-report

Odešle e-mail tobě (poradci) + klientovi s odkazem na PDF.

### Vercel ENV

| Proměnná | Popis |
|----------|-------|
| RESEND_API_KEY | API klíč z Resend.com |
| MAIL_FROM | Odesílatel (např. diagnostika@marek-marek.cz) |
| MAIL_TO_MAREK | Tvůj e-mail pro notifikace |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Service role key (jen backend, nikdy frontend!) |
| CALENDLY_URL | Odkaz na rezervaci callu |

### Deployment

1. `npm install` v kořenu projektu
2. Deploy na Vercel (git push nebo `vercel`)
3. Nastav ENV v Vercel Dashboard
4. V HTML nastav `API_BASE = 'https://tvoje-app.vercel.app'`
