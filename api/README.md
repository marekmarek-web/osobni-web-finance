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
