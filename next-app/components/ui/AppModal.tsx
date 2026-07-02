"use client";

import { useCallback, useEffect, useId, useRef } from "react";

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  className?: string;
};

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function AppModal({ open, onClose, labelledBy, children, className = "" }: AppModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevActive = useRef<HTMLElement | null>(null);
  const baseId = useId();

  useEffect(() => {
    if (!open) return;
    prevActive.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && panel) {
        const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
        );
        if (nodes.length === 0) return;
        const firstN = nodes[0];
        const lastN = nodes[nodes.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstN) {
            e.preventDefault();
            lastN.focus();
          }
        } else if (document.activeElement === lastN) {
          e.preventDefault();
          firstN.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevActive.current?.focus?.();
    };
  }, [open, onClose]);

  const onBackdropPointer = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="presentation">
      <div
        ref={backdropRef}
        id={`${baseId}-backdrop`}
        className="absolute inset-0 bg-brand-navy/75 backdrop-blur-sm"
        aria-hidden
        onMouseDown={onBackdropPointer}
      />
      <div
        className="absolute inset-0 flex items-end justify-center p-3 sm:items-center sm:p-4 pointer-events-none"
        role="presentation"
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          className={`pointer-events-auto max-h-[min(92dvh,720px)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xl ${className}`.trim()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
