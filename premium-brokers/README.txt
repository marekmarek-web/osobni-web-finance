Marek Příbramský – statický web

STRUKTURA
/
├─ index.html
├─ assets/
│  ├─ css/styles.css
│  ├─ js/main.js, anim.js
│  └─ img/ (obrázky)
├─ partials/ (šablony pro referenci)
│  ├─ header.html
│  └─ footer.html
├─ kalkulacky/index.html
├─ hypotecnikalkulacka/, investicnikalkulacka/, zivotnikalkulacka/, penzijnikalkulacka/
├─ spoluprace/, kontakt/, gdpr/, cookies/, blog/
├─ api/
└─ .env.example

ÚPRAVY
• Header a footer jsou inline na každé stránce – úpravy je třeba provést ručně na všech stránkách
• partials/ slouží jen jako šablona pro kopírování
• Pro lokální testování použij lokální server (např. npx serve nebo Live Server)
