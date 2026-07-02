'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/lib/format-currency';
import {
  injectHoneypots,
  submitForm,
  userMessage,
  type SpamErrorCode,
} from '@/lib/form-spam-guard';
import { getCalculatedLtv, getBorrowingAmount, type MortgageState } from '@/lib/mortgage-engine';
import { useMortgageCalculator } from './useMortgageCalculator';

function RangeInput({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full hypo-range"
    />
  );
}

function CurrencyInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="text"
      value={formatCurrency(value)}
      onChange={(e) => {
        const parsed = parseInt(e.target.value.replace(/\s/g, ''), 10) || 0;
        onChange(parsed);
      }}
      className="text-right font-extrabold text-3xl text-brand-dark border-b-2 border-slate-200 focus:border-brand-gold outline-none w-56 bg-transparent transition-colors p-1"
    />
  );
}

function ContactModal({
  open,
  bankName,
  contextText,
  state,
  onClose,
}: {
  open: boolean;
  bankName: string | null;
  contextText: string;
  state: MortgageState;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    if (open && formRef.current) {
      injectHoneypots(formRef.current);
      setStatus('idle');
    }
  }, [open, bankName]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    setStatus('submitting');
    const formData = new FormData(form);
    formData.set('banka', bankName || 'Obecná poptávka');
    formData.set('typ_produktu', state.product === 'mortgage' ? 'Hypotéka' : 'Úvěr');
    formData.set('typ_detail', state.product === 'mortgage' ? state.mortgageType : state.loanType);
    formData.set('vyse_uveru', String(getBorrowingAmount(state)));
    formData.set('hodnota_nemovitosti', state.product === 'mortgage' ? String(state.loan) : '');
    formData.set('vlastni_zdroje', String(state.own));
    formData.set('doba_splaceni', String(state.term));
    formData.set('fixace', String(state.fix));
    formData.set('ltv_akontace', String(getCalculatedLtv(state)));

    try {
      const response = await submitForm(formData, { formEl: form });
      if (response.ok) setStatus('success');
      else throw new Error('submit failed');
    } catch (err) {
      setStatus('idle');
      const code = (err as Error & { code?: SpamErrorCode }).code;
      alert(code ? userMessage(code) : 'Omlouváme se, došlo k chybě při odesílání formuláře.');
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto relative overflow-hidden">
          {status === 'success' ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">
                <i className="fas fa-check" />
              </div>
              <h3 className="text-2xl font-bold text-brand-dark mb-2">Poptávka odeslána!</h3>
              <p className="text-slate-600 mb-8">Děkuji. Budu Vás brzy kontaktovat.</p>
              <button type="button" onClick={onClose} className="text-brand-gold font-bold hover:underline">
                Zavřít okno
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-brand-dark w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 z-10"
              >
                <i className="fas fa-times" />
              </button>
              <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-8 border-b border-slate-100">
                <h3 className="text-2xl font-bold text-brand-dark">Mám zájem o nabídku</h3>
                <p
                  className="text-sm text-slate-600 mt-2 flex items-center gap-2"
                  dangerouslySetInnerHTML={{ __html: contextText }}
                />
              </div>
              <div className="p-8">
                <form ref={formRef} onSubmit={handleSubmit} noValidate>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Jméno a příjmení <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <i className="fas fa-user absolute left-4 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="Jan Novák"
                          className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold outline-none bg-slate-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        E-mail <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <i className="fas fa-envelope absolute left-4 top-3.5 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="vas@email.cz"
                          className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold outline-none bg-slate-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Telefon <span className="text-slate-400 font-normal">(nepovinné)</span>
                      </label>
                      <div className="relative">
                        <i className="fas fa-phone absolute left-4 top-3.5 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="+420 777 ..."
                          className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-gold outline-none bg-slate-50"
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-lg">
                      <input type="checkbox" id="consent" required className="mt-1 w-4 h-4 text-brand-gold rounded" />
                      <label htmlFor="consent" className="text-xs text-slate-600 cursor-pointer">
                        Souhlasím se zpracováním osobních údajů za účelem vytvoření nezávazné nabídky.
                      </label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full mt-8 bg-brand-dark hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg disabled:opacity-60"
                  >
                    {status === 'submitting' ? (
                      <>
                        <i className="fas fa-spinner fa-spin" /> Odesílám...
                      </>
                    ) : (
                      <>
                        <span>Odeslat poptávku</span>
                        <i className="fas fa-paper-plane text-sm" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MortgageCalculator() {
  const calc = useMortgageCalculator();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBank, setModalBank] = useState<string | null>(null);
  const [modalContext, setModalContext] = useState('');

  const openGenericModal = () => {
    setModalBank(null);
    setModalContext('Poptáváte srovnání <strong>všech bank</strong>');
    setModalOpen(true);
  };

  const openBankModal = (bankName: string) => {
    setModalBank(bankName);
    setModalContext(`Vybraná banka: <strong class="text-brand-main">${bankName}</strong>`);
    setModalOpen(true);
  };

  return (
    <section className="bg-brand-light py-10 px-4 md:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Next.js náhled (fáze 2).</strong> Produkční kalkulačka zůstává na{' '}
          <a href="/hypotecnikalkulacka/" className="underline font-semibold">
            /hypotecnikalkulacka/
          </a>{' '}
          — statické HTML se nemění, dokud Next verze neprojde schválením.
        </div>

        <div className="bg-gradient-to-br from-brand-dark to-[#1e3a6e] rounded-3xl p-8 md:p-12 text-white mb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-8">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                Kalkulačka hypoték a úvěrů
                <br />
                <span className="text-brand-gold">Srovnání bez kontaktu</span>
              </h1>
              <p className="text-blue-100 opacity-90 text-lg mb-8 max-w-2xl leading-relaxed">
                <strong>Hypotéka bez telefonního čísla</strong> a nutnosti registrace. Spočítejte si
                splátku pro nové bydlení, auto či konsolidaci úvěrů.
              </p>
              <div className="flex flex-col gap-4">
                <div className="inline-flex bg-slate-900/50 p-1 rounded-xl border border-white/10 w-fit mb-2">
                  <button
                    type="button"
                    onClick={() => calc.switchProduct('mortgage')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      calc.state.product === 'mortgage'
                        ? 'bg-brand-gold text-brand-dark shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <i className="fas fa-home mr-2" />
                    Hypotéka
                  </button>
                  <button
                    type="button"
                    onClick={() => calc.switchProduct('loan')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      calc.state.product === 'loan'
                        ? 'bg-brand-gold text-brand-dark shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <i className="fas fa-hand-holding-usd mr-2" />
                    Úvěry
                  </button>
                </div>
                <div className="inline-flex bg-white/10 p-1.5 rounded-xl backdrop-blur-md border border-white/10 w-fit">
                  <button
                    type="button"
                    onClick={() => calc.switchTab('new')}
                    className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${
                      calc.state.type === 'new'
                        ? 'bg-white text-brand-dark shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {calc.tabNewText}
                  </button>
                  <button
                    type="button"
                    onClick={() => calc.switchTab('refi')}
                    className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${
                      calc.state.type === 'refi'
                        ? 'bg-white text-brand-dark shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    Refinancování
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-brand-border/60">
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">
                  Typ produktu
                </label>
                <div className="flex flex-wrap gap-3">
                  {calc.subTypes.map((t) => {
                    const active = t.id === calc.currentSubType;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => calc.selectSubType(t.id)}
                        className={`px-4 py-3 rounded-lg text-sm font-bold transition-all border ${
                          active
                            ? 'bg-brand-gold text-brand-dark border-brand-gold shadow-md'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                {calc.activeSubTypeInfo && (
                  <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-slate-700 animate-fade-in">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-info-circle text-brand-main mt-0.5 text-lg" />
                      <div>{calc.activeSubTypeInfo}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <label className="text-sm font-bold text-slate-600 tracking-wide uppercase">
                    {calc.loanLabel}{' '}
                    <span className="text-slate-400 font-normal normal-case">(v Kč)</span>
                  </label>
                  <CurrencyInput value={calc.state.loan} onChange={calc.updateProperty} />
                </div>
                <RangeInput
                  min={calc.limits.min}
                  max={calc.limits.max}
                  step={calc.limits.step}
                  value={calc.state.loan}
                  onChange={calc.updateProperty}
                />
              </div>

              {calc.showExtraMoney && (
                <div className="mb-10">
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-sm font-bold text-slate-600 tracking-wide uppercase">
                      Potřebujete peníze navíc?{' '}
                      <span className="text-slate-400 font-normal normal-case">(v Kč)</span>
                    </label>
                    <CurrencyInput value={calc.state.extra} onChange={calc.updateExtra} />
                  </div>
                  <RangeInput min={0} max={1000000} step={10000} value={calc.state.extra} onChange={calc.updateExtra} />
                </div>
              )}

              {calc.showOwnResources && (
                <div className="mb-10">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                    <label className="text-sm font-bold text-slate-600 tracking-wide uppercase">
                      Vlastní zdroje{' '}
                      <span className="text-slate-400 font-normal normal-case">(v Kč)</span>
                    </label>
                    {calc.ltvButtonValues.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1 rounded-lg">
                        <span className="text-xs font-bold text-slate-400 pl-2">{calc.ltvButtonLabel}:</span>
                        {calc.ltvButtonValues.map((val) => {
                          const disabled =
                            calc.state.product === 'mortgage' &&
                            (calc.state.mortgageType === 'investment' ||
                              calc.state.mortgageType === 'american') &&
                            val > 70;
                          const active = calc.state.ltvLock === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              disabled={disabled}
                              onClick={() => calc.setLtv(val)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                                active
                                  ? 'bg-brand-gold text-brand-dark shadow-md'
                                  : 'text-slate-600 hover:bg-brand-gold hover:text-brand-dark'
                              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {val}%
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mb-2">
                    <CurrencyInput value={calc.state.own} onChange={calc.updateOwn} />
                  </div>
                  <RangeInput min={0} max={15000000} step={10000} value={calc.state.own} onChange={calc.updateOwn} />
                  {calc.showInvestInfo && (
                    <div className="mt-3 text-xs text-brand-gold font-medium flex items-center gap-2">
                      <i className="fas fa-lock" /> U tohoto typu hypotéky je maximální LTV omezeno (typicky 60–70 %).
                    </div>
                  )}
                </div>
              )}

              {calc.showPropertyInfo && (
                <div className="bg-blue-50/50 rounded-xl p-4 mb-8 border border-blue-100/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-500 font-medium">
                      <i className={`fas ${calc.state.product === 'mortgage' ? 'fa-home' : 'fa-car'} mr-2 text-brand-main`} />
                      {calc.propertyLabel}
                    </div>
                    <div className="font-bold text-brand-dark text-lg">
                      {formatCurrency(calc.result.propertyValue)} Kč
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-blue-100/80 pt-2">
                    <div className="text-sm text-slate-500 font-medium">
                      <i className="fas fa-hand-holding-usd mr-2 text-brand-main" />
                      {calc.borrowingLabel}
                    </div>
                    <div className="font-bold text-brand-dark text-lg">
                      {formatCurrency(calc.result.borrowingAmount)} Kč
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-4 uppercase tracking-wide">
                    Doba splácení
                  </label>
                  <div className="flex items-center gap-4">
                    <RangeInput
                      min={calc.termMin}
                      max={calc.termMax}
                      step={1}
                      value={calc.state.term}
                      onChange={calc.updateTerm}
                    />
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-bold text-brand-dark min-w-[80px] text-center">
                      {calc.state.term} let
                    </div>
                  </div>
                </div>
                {calc.showFixation && (
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">
                      Fixace úroku
                    </label>
                    <select
                      value={calc.fixYears}
                      onChange={(e) => calc.setFixYears(Number(e.target.value))}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 text-brand-dark font-bold py-3.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer shadow-sm"
                    >
                      <option value={3}>3 roky</option>
                      <option value={5}>5 let</option>
                      <option value={7}>7 let</option>
                      <option value={10}>10 let</option>
                    </select>
                  </div>
                )}
              </div>

              {calc.showLtvWarning && (
                <div className="mt-6 p-4 bg-orange-50 text-orange-800 rounded-xl text-sm border border-orange-100 flex items-start gap-3">
                  <i className="fas fa-exclamation-triangle mt-0.5 text-brand-gold" />
                  <div>
                    <strong>Pozor na vysoké LTV ({calc.calcLtv}%).</strong> Většina bank poskytuje
                    hypotéky maximálně do 80 % nebo 90 % hodnoty nemovitosti.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-8">
              <div className="bg-brand-dark text-white rounded-2xl shadow-2xl border border-slate-800 p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-main opacity-20 rounded-full blur-2xl -mr-10 -mt-10" />
                <h3 className="text-slate-400 font-medium mb-2 relative z-10 text-sm uppercase tracking-wider">
                  Měsíční splátka od
                </h3>
                <div className="flex items-baseline gap-2 mb-8 relative z-10">
                  <span className="text-5xl md:text-6xl font-black text-white tracking-tight">
                    {formatCurrency(calc.result.monthlyPayment)}
                  </span>
                  <span className="text-2xl font-medium text-slate-500">Kč</span>
                </div>
                <div className="space-y-0 relative z-10 bg-slate-800/50 rounded-xl p-1 backdrop-blur-sm border border-white/5">
                  <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <span className="text-slate-300 text-sm">Odhad úroku</span>
                    <span className="font-bold text-brand-gold text-lg">
                      {calc.result.finalRate.toFixed(2).replace('.', ',')} %
                    </span>
                  </div>
                  {calc.showLtvRow && (
                    <div className="flex justify-between items-center p-4 border-b border-white/10">
                      <span className="text-slate-300 text-sm">{calc.ltvResultLabel}</span>
                      <span className="font-bold text-brand-gold text-lg">{calc.result.displayLtv} %</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-4">
                    <span className="text-slate-300 text-sm">Celkem zaplatíte</span>
                    <span className="font-bold text-white text-lg">
                      {formatCurrency(calc.result.totalPaid)} Kč
                    </span>
                  </div>
                </div>
                <div className="mt-8 relative z-10">
                  <button
                    type="button"
                    onClick={openGenericModal}
                    className="group relative w-full bg-gradient-to-r from-brand-gold to-brand-lightgold text-brand-dark font-extrabold py-5 px-6 rounded-xl shadow-lg overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/30 skew-x-[-20deg] animate-shimmer" />
                    <span className="relative">Chci nezávaznou nabídku</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 mb-20">
          <div className="grid grid-cols-1 gap-4">
            {calc.bankOffers.map((offer) => (
              <div
                key={offer.bank.id}
                className="animate-fade-in bg-white border border-slate-100 rounded-xl p-5 flex flex-col md:flex-row items-center gap-6 hover:shadow-lg hover:border-brand-gold transition-all"
                style={{ animationDelay: `${offer.delayMs}ms` }}
              >
                <img
                  src={offer.bank.logoUrl || `https://placehold.co/100x30/1e293b/ffffff?text=${offer.bank.id.toUpperCase()}`}
                  alt={offer.bank.name}
                  className="bank-logo h-8 max-w-[100px] object-contain"
                />
                <div className="flex-1 flex flex-row justify-between w-full md:w-auto items-center gap-4">
                  <div className="text-center md:text-left">
                    <div className="text-xs text-slate-400 font-semibold uppercase">Úrok</div>
                    <div className="font-bold text-brand-dark text-lg">
                      {offer.rate.toFixed(2).replace('.', ',')} %
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-xs text-slate-400 font-semibold uppercase">Měsíčně</div>
                    <div className="font-bold text-xl text-brand-dark">
                      {formatCurrency(offer.monthlyPayment)} Kč
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openBankModal(offer.bank.name)}
                  className="bg-gradient-to-r from-brand-gold to-brand-lightgold text-brand-dark font-bold py-2 px-6 rounded-xl shadow-md w-full md:w-auto"
                >
                  Chci nabídku
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ContactModal
        open={modalOpen}
        bankName={modalBank}
        contextText={modalContext}
        state={calc.state}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
