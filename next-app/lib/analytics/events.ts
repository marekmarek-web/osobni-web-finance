/**
 * Jednotná taxonomie custom eventů (Plausible).
 * Formát: snake_case, bez PII v props (viz docs/event-taxonomy.md).
 */
export const AnalyticsEvents = {
  pageView: "page_view",
  ctaClick: "cta_click",
  leadModalOpen: "lead_modal_open",
  leadSubmitSuccess: "lead_submit_success",
  leadSubmitError: "lead_submit_error",
  subscribeSubmitSuccess: "subscribe_submit_success",
  subscribeSubmitError: "subscribe_submit_error",
  calculatorStarted: "calculator_started",
  calculatorCompleted: "calculator_completed",
  calculatorCtaClick: "calculator_cta_click",
  /** Výpis blogu (custom; pageview už měří URL). */
  blogListingView: "blog_listing_view",
  /** Detail článku — preferujte před starým názvem. */
  articleView: "article_view",
  /** @deprecated použijte articleView */
  blogArticleView: "article_view",
  articleCtaClick: "article_cta_click",
  adminLoginSuccess: "admin_login_success",
  adminLoginError: "admin_login_error",
  /** Domovská konzultace — výběr tématu (krok 1). */
  ctaHomeConsultation: "cta_click",
  /** @deprecated */
  ctaHeaderContact: "cta_click",
  /** @deprecated */
  ctaMobileContact: "cta_click",
} as const;

export type AnalyticsCalculatorId = "pension" | "mortgage" | "life" | "investment";
