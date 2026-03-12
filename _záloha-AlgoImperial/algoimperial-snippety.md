# AlgoImperial – vyjmuté snippety (pro použití mimo web)

## 1. HTML karta – Jednorázové investice (typ financni-analyza / fp-poradce)

```html
                                <!-- Imperial -->
                                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group duration-300 transform hover:-translate-y-1">
                                    <div class="flex justify-between mb-3">
                                        <span class="font-bold text-slate-800">AlgoImperial</span>
                                        <span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">12% p.a.</span>
                                    </div>
                                    <div class="space-y-3">
                                        <div class="relative">
                                            <input type="number" id="inv-imperial-amount" class="form-input w-full pl-3 pr-10 py-2 text-sm bg-white focus:ring-2 focus:ring-brand-main/20" placeholder="0">
                                            <span class="absolute right-3 top-2 text-xs text-slate-400 font-medium">Kč</span>
                                        </div>
                                        <div class="relative">
                                            <input type="number" id="inv-imperial-years" class="form-input w-full pl-3 pr-10 py-2 text-sm bg-white" placeholder="10">
                                            <span class="absolute right-3 top-2 text-xs text-slate-400 font-medium">roků</span>
                                        </div>
                                        <button class="w-full text-xs font-bold text-white bg-brand-main py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity mt-1 hover:bg-brand-main/90 shadow-md shimmer-btn">
                                            Přidat do návrhu
                                        </button>
                                    </div>
                                </div>
```

## 2. FUND_DETAILS (JavaScript)

```javascript
'imperial': {
    name: "AlgoImperial",
    manager: "Imperium Finance",
    goal: "Absolutní výnos nezávislý na trhu",
    assets: "Algoritmické strategie, futures",
    yield: "Obchodování volatility",
    risks: "Technické selhání, Nízká volatilita trhu, Kreditní riziko",
    liquidity: "Měsíční (T+15)",
    suitable: "Dynamičtí investoři hledající diverzifikaci",
    why: "Snižuje korelaci portfolia s akciovým trhem a stabilizuje výnosy."
},
```

## 3. Položka v poli funds (PDF / report)

```javascript
{
    key: 'imperial',
    name: 'AlgoImperial',
    badge: 'Dynamický',
    badgeColor: '#dc2626',
    risk: '5/7',
    goal: 'Absolutní výnos',
    horizon: '5+ let',
    minInvest: '1 000 000 Kč',
    currency: 'CZK',
    liquidity: 'Měsíční',
    description: 'AlgoImperial je dynamický fond využívající algoritmické strategie pro dosažení absolutního výnosu nezávisle na tržních podmínkách.',
    strategy: 'Fond kombinuje kvantitativní analýzu s aktivním řízením rizika. Využívá pokročilé matematické modely pro identifikaci tržních neefektivit a arbitrážních příležitostí napříč různými třídami aktiv.',
    benefits: ['Nízká korelace s tradičními trhy', 'Aktivní řízení rizika', 'Systematický investiční přístup', 'Diverzifikace portfolia'],
    representation: 'Algoritmické strategie, Futures, Opce'
}
```

## 4. Výchozí investice (jedna položka)

```javascript
{ id: 1, productKey: 'imperial', type: 'lump', amount: 0, years: 10, annualRate: 0.12, computed: {fv:0} }
```

## 5. PDF render – blok pro popis fondu

```javascript
if(usedKeys.has('imperial')) {
    html += `<div class="fund-detail"><div class="fund-title">AlgoImperial <span class="badge">Dynamický</span></div><div class="fund-meta">Riziko: 5/7 • Cíl: Absolutní výnos</div><p style="margin-top:2mm">Algoritmicky řízené portfolio využívající pokročilé matematické modely pro identifikaci tržních příležitostí a řízení rizika.</p></div>`;
}
```

## 6. Mapování názvů (getProductName / names)

```javascript
'imperial': 'AlgoImperial'
```

## 7. Inv fields (vazby inputů)

```javascript
{ id: 'inv-imperial-amount', key: 'imperial', type: 'lump', field: 'amount' },
{ id: 'inv-imperial-years', key: 'imperial', type: 'lump', field: 'years' },
```

## 8. restoreInv / set (pro naplnění formuláře ze stavu)

```javascript
restoreInv('imperial', 'lump', 'amount', 'inv-imperial-amount');
restoreInv('imperial', 'lump', 'years', 'inv-imperial-years');
```

## 9. FA s.r.o. – FUND_LOGOS

```javascript
this.FUND_LOGOS = ['AlgoImperial', 'Creif', 'ATRIS', 'Fidelity', 'iShares', 'PENTA', 'Conseq'];
// Po odebrání: ['Creif', 'ATRIS', 'Fidelity', 'iShares', 'PENTA', 'Conseq']
```

## 10. FA s.r.o. – INV_FUNDS (řádek)

```javascript
{ name: 'AlgoImperial', yieldPct: 12 },
```

## 11. Obrázek

- Název souboru: `algoimperial.png` nebo `AlgoImperial.png` (podle konvence složky images).
