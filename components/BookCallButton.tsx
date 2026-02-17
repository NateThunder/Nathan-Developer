"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

const CONTACT_EMAIL = "hello@studio.com";
const CONTACT_PHONE_E164 = "+447846677463";
const CONTACT_PHONE_LABEL = "+44 7846 677463";

type BookCallButtonProps = {
  className: string;
  label?: string;
  onOpen?: () => void;
};

export function BookCallButton({
  className,
  label = "Book a call",
  onOpen,
}: BookCallButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const openDialog = () => {
    onOpen?.();
    setIsOpen(true);
  };

  return (
    <>
      <button type="button" onClick={openDialog} className={className}>
        {label}
      </button>

      {isOpen && isMounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-6 sm:items-center sm:pb-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <button
                type="button"
                aria-label="Close contact details"
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-[#0f1e27]/80"
              />

              <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-t-[24px] border-2 border-[var(--color-accent-warm)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-card)] sm:rounded-[24px] sm:p-6">
                <button
                  type="button"
                  aria-label="Close window"
                  onClick={() => setIsOpen(false)}
                  className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                >
                  x
                </button>

                <p className="mono-label text-[11px] text-[var(--color-accent-warm)]">
                  CONTACT DETAILS
                </p>
                <h3
                  id={titleId}
                  className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--color-text)]"
                >
                  Book a call
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Email or call directly. We can continue by phone or schedule a
                  meeting right after.
                </p>

                <div className="mt-6 grid gap-3">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="pixel-notch inline-flex flex-col items-start gap-1 rounded-[14px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>Email</span>
                    <span className="break-all">{CONTACT_EMAIL}</span>
                  </a>

                  <a
                    href={`tel:${CONTACT_PHONE_E164}`}
                    className="pixel-notch inline-flex flex-col items-start gap-1 rounded-[14px] border-2 border-[var(--color-accent-warm)] bg-[var(--color-surface-alt)] px-4 py-3 text-left text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>Mobile</span>
                    <span>{CONTACT_PHONE_LABEL}</span>
                  </a>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
