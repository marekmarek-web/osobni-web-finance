# Struktura složky Nový web

Tato složka obsahuje projekty uspořádané podle GitHub repozitářů.

## Složky podle repozitářů

### 📁 osobni-web-finance
**Repo:** https://github.com/marekmarek-web/osobni-web-finance  
**Deploy:** https://osobni-web-finance.vercel.app

Obsahuje:
- **api/** – API endpointy (create-checkout, stripe-webhook, send-report)
- **calculations/** – výpočty benefitů a rizik
- **cookies/** – stránka cookies
- **financni-analyza/** – finanční analýza
- **financni-plan/** – finanční plán
- **fp-poradce/** – FP pro poradce (předplatné, přihlášení)
- **gdpr/** – GDPR stránka
- **hypotecnikalkulacka/** – hypotéční kalkulačka
- **investicnikalkulacka/** – investiční kalkulačka
- **penzijnikalkulacka/** – penzijní kalkulačka
- **zivotnikalkulacka/** – životní kalkulačka
- **podnikatele/** – pro podnikatele
- **podnikatelelp/** – landing page podnikatelé
- **reality/** – reality
- **FA - Lead - s.r.o/**, **FA - s.r.o/** – diagnostika
- **images/** – obrázky a loga
- **archiv/** – starší verze souborů
- **pracovni-materialy/** – pracovní soubory (final, FP-Gener)
- Konfigurace: package.json, vercel.json, supabase SQL

### 📁 premium-brokers (marek-pribramsky)
**Repo:** https://github.com/marekmarek-web/marek-pribramsky

Statický HTML web Marek Příbramský – Premium Brokers. Tailwind, GSAP, Chart.js.

Obsahuje: index.html, assets/, blog/, kalkulacky/, kontakt/, gdpr/, cookies/, …

### 📁 m2digitalagency
**Repo:** https://github.com/marekmarek-web/m2digitalagency

Obsahuje:
- **demo/** – demo weby (aurora, instalater, realty, uctarna)
- **images/** – obrázky a loga
- **obchodni-podminky/** – obchodní podmínky
- **tvorba-webu-cena/** – tvorba webu cena
- **web-na-pronajem/** – web na pronájem
- **web-pro-zivnostniky/** – web pro živnostníky
- index.html, robots.txt, sitemap.xml, videohero.mp4

## Složka FA (původní)
Původní složka FA sloužila jako zdroj. Obsah byl zkopírován do osobni-web-finance a m2digitalagency. Složku FA lze smazat po ověření, že vše funguje.

## Napojení na GitHub
Pro push změn:
```bash
cd osobni-web-finance
git remote add origin https://github.com/marekmarek-web/osobni-web-finance.git
git add .
git commit -m "Organizace struktury"
git push -u origin main
```

```bash
cd premium-brokers
git remote add origin https://github.com/marekmarek-web/marek-pribramsky.git
git add .
git commit -m "Aktualizace"
git push -u origin master
```

```bash
cd m2digitalagency
git remote add origin https://github.com/marekmarek-web/m2digitalagency.git
git add .
git commit -m "Organizace struktury"
git push -u origin main
```
