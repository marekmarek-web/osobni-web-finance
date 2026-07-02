'use client';

import { useCallback, useMemo, useState } from 'react';
import { calculateBankOffers } from '@/lib/bank-offers';
import {
  AUTO_DOWN_PAYMENT_VALUES,
  BANKS_DATA,
  DEFAULT_MORTGAGE_STATE,
  LIMITS,
  MORTGAGE_LTV_VALUES,
  PRODUCT_TYPES,
} from '@/lib/mortgage-data';
import {
  calculateMortgage,
  getBorrowingAmount,
  getCalculatedLtv,
  syncOwnFromLtv,
  type MortgageState,
} from '@/lib/mortgage-engine';

export function useMortgageCalculator() {
  const [state, setState] = useState<MortgageState>({ ...DEFAULT_MORTGAGE_STATE });
  const [fixYears, setFixYears] = useState(5);

  const result = useMemo(
    () => calculateMortgage(state, BANKS_DATA, { fixYears }),
    [state, fixYears]
  );

  const bankOffers = useMemo(
    () =>
      calculateBankOffers(
        state,
        BANKS_DATA,
        result.borrowingAmount,
        state.term * 12,
        fixYears
      ),
    [state, result.borrowingAmount, fixYears]
  );

  const calcLtv = useMemo(() => getCalculatedLtv(state), [state]);
  const borrowingAmount = useMemo(() => getBorrowingAmount(state), [state]);

  const currentSubType =
    state.product === 'mortgage' ? state.mortgageType : state.loanType;

  const subTypes = PRODUCT_TYPES[state.product];
  const activeSubTypeInfo = subTypes.find((t) => t.id === currentSubType)?.info;

  const showOwnResources =
    state.product === 'mortgage' ||
    (state.product === 'loan' && state.loanType === 'auto');

  const showPropertyInfo =
    state.product === 'mortgage' ||
    (state.product === 'loan' && state.loanType === 'auto');

  const showExtraMoney =
    state.product === 'loan' && state.loanType === 'consolidation';

  const showFixation = state.product === 'mortgage';
  const showLtvWarning = state.product === 'mortgage' && calcLtv > 90;
  const showLtvRow =
    state.product === 'mortgage' ||
    (state.product === 'loan' && state.loanType === 'auto');

  const showInvestInfo =
    state.product === 'mortgage' &&
    (state.mortgageType === 'investment' || state.mortgageType === 'american');

  const limits = LIMITS[state.product];

  const termMin = state.product === 'mortgage' ? 5 : 1;
  const termMax =
    state.product === 'mortgage'
      ? 35
      : state.loanType === 'auto'
        ? 10
        : 12;

  const ltvButtonValues =
    state.product === 'mortgage'
      ? MORTGAGE_LTV_VALUES
      : state.product === 'loan' && state.loanType === 'auto'
        ? AUTO_DOWN_PAYMENT_VALUES
        : [];

  const ltvButtonLabel =
    state.product === 'mortgage' ? 'LTV' : 'Akontace';

  const loanLabel =
    state.product === 'mortgage'
      ? 'Hodnota nemovitosti'
      : state.loanType === 'auto'
        ? 'Cena vozu'
        : state.loanType === 'consolidation'
          ? 'Kolik máte stávající závazky'
          : 'Kolik si chcete půjčit';

  const propertyLabel =
    state.product === 'mortgage'
      ? 'Hodnota nemovitosti:'
      : state.loanType === 'auto'
        ? 'Hodnota vozu:'
        : 'Hodnota nemovitosti:';

  const borrowingLabel = 'Výše úvěru:';
  const ltvResultLabel = state.product === 'mortgage' ? 'LTV' : 'Akontace';
  const tabNewText = state.product === 'mortgage' ? 'Nová hypotéka' : 'Nový úvěr';

  const syncOwn = useCallback((next: MortgageState) => {
    if (next.product === 'mortgage' && next.ltvLock != null) {
      return { ...next, own: syncOwnFromLtv(next) };
    }
    if (next.product === 'loan' && next.loanType === 'auto' && next.ltvLock != null) {
      return {
        ...next,
        own: Math.round((next.loan * (next.ltvLock / 100)) / 1000) * 1000,
      };
    }
    return next;
  }, []);

  const switchProduct = useCallback(
    (product: MortgageState['product']) => {
      setState((prev) => {
        if (product === 'mortgage') {
          const next: MortgageState = {
            ...prev,
            product,
            mortgageType: 'standard',
            loan: LIMITS.mortgage.default,
            ltvLock: 90,
            own: 0,
            term: 30,
          };
          next.own = syncOwnFromLtv(next);
          return next;
        }

        return {
          ...prev,
          product,
          loanType: 'consumer',
          loan: LIMITS.loan.default,
          own: 0,
          extra: 0,
          ltvLock: null,
          term: 30,
        };
      });
      setFixYears(5);
    },
    []
  );

  const switchTab = useCallback((type: MortgageState['type']) => {
    setState((prev) => ({ ...prev, type }));
  }, []);

  const selectSubType = useCallback(
    (id: string) => {
      setState((prev) => {
        let next = { ...prev };
        if (prev.product === 'mortgage') {
          next.mortgageType = id as MortgageState['mortgageType'];
          if (
            (id === 'investment' || id === 'american') &&
            (next.ltvLock ?? 0) > 70
          ) {
            next.ltvLock = 70;
            next = syncOwn(next);
          }
        } else {
          next.loanType = id as MortgageState['loanType'];
          if (id !== 'auto') next.ltvLock = null;
        }
        return next;
      });
    },
    [syncOwn]
  );

  const updateProperty = useCallback(
    (val: number) => {
      setState((prev) => {
        const lim = LIMITS[prev.product];
        const clamped = Math.min(lim.max, Math.max(lim.min, val));
        return syncOwn({ ...prev, loan: clamped });
      });
    },
    [syncOwn]
  );

  const updateOwn = useCallback((val: number) => {
    setState((prev) => ({ ...prev, own: val, ltvLock: null }));
  }, []);

  const updateExtra = useCallback((val: number) => {
    setState((prev) => ({ ...prev, extra: val }));
  }, []);

  const updateTerm = useCallback((val: number) => {
    setState((prev) => ({ ...prev, term: val }));
  }, []);

  const setLtv = useCallback(
    (targetVal: number) => {
      setState((prev) => {
        if (
          prev.product === 'mortgage' &&
          (prev.mortgageType === 'investment' || prev.mortgageType === 'american') &&
          targetVal > 70
        ) {
          return prev;
        }

        const next = { ...prev, ltvLock: targetVal };
        return syncOwn(next);
      });
    },
    [syncOwn]
  );

  return {
    state,
    fixYears,
    setFixYears,
    result,
    bankOffers,
    calcLtv,
    borrowingAmount,
    currentSubType,
    subTypes,
    activeSubTypeInfo,
    showOwnResources,
    showPropertyInfo,
    showExtraMoney,
    showFixation,
    showLtvWarning,
    showLtvRow,
    showInvestInfo,
    limits,
    termMin,
    termMax,
    ltvButtonValues,
    ltvButtonLabel,
    loanLabel,
    propertyLabel,
    borrowingLabel,
    ltvResultLabel,
    tabNewText,
    switchProduct,
    switchTab,
    selectSubType,
    updateProperty,
    updateOwn,
    updateExtra,
    updateTerm,
    setLtv,
  };
}
