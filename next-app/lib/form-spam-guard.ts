const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/kontakt@marek-marek.cz';
const MIN_SUBMIT_MS = 4000;
const RATE_LIMIT_MS = 120000;

const DISPOSABLE_DOMAINS = new Set([
  'wshu.net',
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'yopmail.com',
  'sharklasers.com',
  'grr.la',
  'discard.email',
  'getnada.com',
]);

const SPAM_PATTERNS = [
  /graph\.org/i,
  /transaction to you/i,
  /continue\s*=>/i,
  /us[\s-]*dollar/i,
  /balance-\d+/i,
  /https?:\/\//i,
  /www\./i,
  /\$\{/,
  /<script/i,
  /bitcoin|crypto wallet|click here/i,
];

function isSpamText(value: unknown): boolean {
  if (value == null) return false;
  const s = String(value).trim();
  if (!s) return false;
  return SPAM_PATTERNS.some((p) => p.test(s));
}

function payloadFromFormData(fd: FormData): Record<string, FormDataEntryValue> {
  const o: Record<string, FormDataEntryValue> = {};
  fd.forEach((v, k) => {
    o[k] = v;
  });
  return o;
}

export type SpamErrorCode =
  | 'honeypot'
  | 'honeypot2'
  | 'too_fast'
  | 'spam_name'
  | 'bad_email'
  | 'disposable_email'
  | 'spam_email'
  | 'spam_phone'
  | 'spam_field'
  | 'rate_limit';

export function validatePayload(data: Record<string, FormDataEntryValue | string | number>): SpamErrorCode | null {
  if (String(data._gotcha || '').trim()) return 'honeypot';
  if (String(data.company || data.website || '').trim()) return 'honeypot2';

  const openedAt = Number(data._opened_at || 0);
  if (openedAt > 0 && Date.now() - openedAt < MIN_SUBMIT_MS) return 'too_fast';

  const name = String(data.name || '').trim();
  if (name && (isSpamText(name) || name.length > 100)) return 'spam_name';

  const email = String(data.email || '')
    .trim()
    .toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'bad_email';
  const domain = email.split('@')[1];
  if (domain && DISPOSABLE_DOMAINS.has(domain)) return 'disposable_email';
  if (isSpamText(email)) return 'spam_email';

  const phone = String(data.phone || data.telefon || '').trim();
  if (phone && isSpamText(phone)) return 'spam_phone';

  for (const [key, val] of Object.entries(data)) {
    if (key.startsWith('_') || key === 'company' || key === 'website') continue;
    if (typeof val === 'string' && isSpamText(val)) return 'spam_field';
  }

  try {
    const last = Number(localStorage.getItem('mm_form_last_submit') || 0);
    if (Date.now() - last < RATE_LIMIT_MS) return 'rate_limit';
  } catch {
    /* ignore */
  }

  return null;
}

export function injectHoneypots(formEl: HTMLFormElement): number {
  const t = Date.now();
  formEl.dataset.openedAt = String(t);

  for (const spec of [
    { name: '_gotcha', label: 'Leave empty' },
    { name: 'company', label: 'Company' },
  ]) {
    if (formEl.querySelector(`[name="${spec.name}"]`)) continue;
    const input = document.createElement('input');
    input.type = 'text';
    input.name = spec.name;
    input.tabIndex = -1;
    input.autocomplete = 'off';
    input.setAttribute('aria-hidden', 'true');
    input.style.cssText =
      'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
    formEl.appendChild(input);
  }

  return t;
}

function applyFormSubmitMeta(
  target: FormData | Record<string, unknown>,
  openedAt: number
): FormData | Record<string, unknown> {
  const ts = openedAt || Date.now();
  if (target instanceof FormData) {
    target.set('_gotcha', '');
    target.set('_captcha', 'true');
    target.set('_opened_at', String(ts));
    target.set('company', String(target.get('company') || ''));
    return target;
  }
  return {
    ...target,
    _gotcha: '',
    _captcha: 'true',
    _opened_at: ts,
    company: target.company || '',
  };
}

export async function submitForm(
  payload: FormData | Record<string, unknown>,
  options: { openedAt?: number; formEl?: HTMLFormElement } = {}
): Promise<Response> {
  const isFormData = payload instanceof FormData;
  const openedAt =
    options.openedAt ||
    Number(
      (options.formEl && options.formEl.dataset.openedAt) ||
        (isFormData
          ? payload.get('_opened_at')
          : (payload as Record<string, unknown>)._opened_at) ||
        0
    );

  const enriched = applyFormSubmitMeta(payload, openedAt || Date.now());
  const check = isFormData
    ? validatePayload(payloadFromFormData(enriched as FormData))
    : validatePayload(enriched as Record<string, FormDataEntryValue>);

  if (check) {
    const err = new Error('SPAM_BLOCKED') as Error & { code: SpamErrorCode };
    err.code = check;
    throw err;
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit = enriched as BodyInit;

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(enriched);
  }

  const response = await fetch(FORMSUBMIT_URL, {
    method: 'POST',
    headers,
    body,
  });

  try {
    localStorage.setItem('mm_form_last_submit', String(Date.now()));
  } catch {
    /* ignore */
  }

  return response;
}

export function userMessage(code: SpamErrorCode): string {
  if (code === 'rate_limit') {
    return 'Formulář byl nedávno odeslán. Počkejte prosím chvíli a zkuste to znovu.';
  }
  if (code === 'too_fast') {
    return 'Odeslání bylo příliš rychlé. Vyplňte formulář prosím znovu.';
  }
  return 'Odeslání se nepodařilo ověřit. Zkontrolujte údaje nebo nás kontaktujte telefonicky.';
}
