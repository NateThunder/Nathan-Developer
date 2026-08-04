"use client";

type ConsentChoice = "granted" | "denied";

type CookieConsentProps = {
  choice: ConsentChoice | null;
  onChoice: (choice: ConsentChoice) => void;
  onReset: () => void;
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

export default function CookieConsent({ choice, onChoice, onReset }: CookieConsentProps) {
  if (choice) {
    return (
      <button
        type="button"
        onClick={onReset}
        className={`fixed bottom-3 left-3 z-[100] rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-muted)] shadow-lg transition hover:text-[var(--color-text)] ${FOCUS_RING}`}
      >
        Privacy settings
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-3 bottom-3 z-[110] mx-auto max-w-2xl rounded-[18px] border-2 border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[0_18px_38px_rgba(5,14,18,0.55)]"
    >
      <h2 id="cookie-consent-title" className="text-base font-semibold text-[var(--color-text)]">
        Analytics cookies
      </h2>
      <p id="cookie-consent-description" className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        With your permission, Google Analytics helps us understand how the site is used and which
        enquiries lead to bookings. We do not load analytics unless you accept.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onChoice("granted")}
          className={`rounded-full border-2 border-[#8a3f2f] bg-[var(--color-accent-warm)] px-4 py-2 text-sm font-semibold text-[#1d1b1a] ${FOCUS_RING}`}
        >
          Accept analytics
        </button>
        <button
          type="button"
          onClick={() => onChoice("denied")}
          className={`rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] ${FOCUS_RING}`}
        >
          Reject analytics
        </button>
      </div>
    </section>
  );
}
