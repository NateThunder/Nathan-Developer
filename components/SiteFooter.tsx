import { BookCallButton } from "@/components/BookCallButton";
import { SectionVectorArt } from "@/components/SectionVectorArt";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

const footerLinks = [
  { href: "#features", label: "Features" },
  { href: "#services", label: "Services" },
  { href: "#work", label: "Work" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#contact", label: "Contact" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="contact"
      className="scroll-mt-24 border-t-2 border-[var(--color-border)] bg-[var(--color-band)] pb-6 pt-3 sm:pb-8 sm:pt-4"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="pixel-notch rounded-[24px] border-2 border-[var(--color-accent-warm)] bg-[var(--color-bg-elevated)] p-5 sm:p-8 lg:p-10">
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mono-label text-[11px] text-[var(--color-accent-warm)]">
                START A PROJECT
              </p>
              <h2 className="mt-3 max-w-[24ch] text-balance text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text)] sm:text-4xl">
                Ready to build a website that performs like a product?
              </h2>
              <p className="mt-4 max-w-[64ch] text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                Share your goals and we will respond with a clear scope,
                timeline, and next steps.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <BookCallButton
                  className={`pixel-notch inline-flex w-full items-center justify-center rounded-full border-2 border-[var(--color-accent-deep)] bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-[#2c2f2d] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 sm:w-auto ${FOCUS_RING}`}
                />
                <a
                  href="#work"
                  className={`inline-flex w-full items-center justify-center rounded-full border-2 border-[var(--color-accent-warm)] bg-[var(--color-surface-alt)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)] sm:w-auto ${FOCUS_RING}`}
                >
                  See work
                </a>
              </div>
            </div>

            <SectionVectorArt
              variant="footer"
              className="hidden h-[88px] w-[160px] rounded-[16px] border-2 border-[var(--color-border)] lg:block"
            />
          </div>
        </div>

        <div className="mt-8 grid gap-8 border-t-2 border-[var(--color-border)] pt-7 sm:mt-10 sm:pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-base font-semibold text-[var(--color-text)]">
              &lt;STUDIO_NAME&gt;
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
              Web design studio for modern teams that need clear strategy and
              production-ready execution.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Navigation</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={`transition hover:text-[var(--color-text)] ${FOCUS_RING}`}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              <li>
                <a
                  href="mailto:hello@studio.com"
                  className={`transition hover:text-[var(--color-text)] ${FOCUS_RING}`}
                >
                  hello@studio.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+447846677463"
                  className={`transition hover:text-[var(--color-text)] ${FOCUS_RING}`}
                >
                  +44 7846 677463
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Social</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              <li>
                <a
                  href="https://www.linkedin.com"
                  className={`transition hover:text-[var(--color-text)] ${FOCUS_RING}`}
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://x.com"
                  className={`transition hover:text-[var(--color-text)] ${FOCUS_RING}`}
                >
                  X / Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://dribbble.com"
                  className={`transition hover:text-[var(--color-text)] ${FOCUS_RING}`}
                >
                  Dribbble
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t-2 border-[var(--color-border)] pt-6 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>(c) {year} &lt;STUDIO_NAME&gt;. All rights reserved.</p>
          <p className="mono-label text-[10px] text-[var(--color-accent-warm)]">
            // 8px grid rhythm / vector first / pixel accents
          </p>
        </div>
      </div>
    </footer>
  );
}
