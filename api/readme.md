# Send Report API

Serverless funkce pro odesílání assessment reportů e-mailem s PDF přílohami.

## Nastavení

### Proměnné prostředí

Nastavte následující proměnné v Vercel Settings → Environment Variables:

- `RESEND_API_KEY` - API klíč z Resend.com
- `MAIL_FROM` - E-mailová adresa odesílatele (musí být ověřena v Resend)
- `MAIL_TO_MAREK` - Cílová e-mailová adresa

### Příklad CLI nastavení

```bash
vercel env add RESEND_API_KEY production
vercel env add MAIL_FROM production  
vercel env add MAIL_TO_MAREK production
vercel deploy
```

## Další endpointy (portál)

- **client-link.js** – Propojení klienta po přihlášení. POST, Bearer JWT.
- **client-invite.js** – Pozvání klienta + e-mail. POST, Bearer JWT, body: email, name?, phone?.
- **client-request.js** – Poptávka od klienta + e-mail poradci. POST, Bearer JWT, body: type, message?, file_paths?.

Pro portál doplňte env: `PORTAL_BASE_URL` (základ URL portálu pro odkazy v e-mailech).
