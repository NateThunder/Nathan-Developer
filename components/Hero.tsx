import { HeroIllustration } from "@/components/HeroIllustration";
import { BookCallButton } from "@/components/BookCallButton";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

export function Hero() {
  return (
    <section id="top" className="relative border-b-2 border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 pb-12 pt-8 sm:gap-10 sm:px-6 sm:pb-16 sm:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-8 lg:pb-24 lg:pt-20">
        <div>
          <p className="mono-label text-[11px] text-[var(--color-accent)]">
            Nathan Somevi | Full Stack Engineer | WEB DESIGN
          </p>

          <h1 className="mt-4 max-w-[15ch] text-balance text-3xl font-semibold tracking-[-0.03em] text-[var(--color-text)] sm:text-5xl lg:text-6xl">
            I build software that helps your business grow.
          </h1>

          <p className="mt-6 max-w-[58ch] text-base leading-7 text-[var(--color-muted)] sm:text-lg sm:leading-8">
            Websites, applications, and custom systems designed to be easy to manage, flexible to change, 
            and tailored to your vision.
          </p>

          <p className="mt-5 inline-flex max-w-full items-center rounded-full border-2 border-[var(--color-accent-warm)] bg-[var(--color-surface-alt)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-accent)]">
            <span className="typewriter-line">System status: shipping clarity + speed.</span>
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <BookCallButton
              className={`pixel-notch inline-flex w-full items-center justify-center rounded-full border-2 border-[var(--color-accent-deep)] bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-[#2c2f2d] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 sm:w-auto ${FOCUS_RING}`}
            />
            <a
              href="#work"
              className={`inline-flex w-full items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent-warm)] sm:w-auto ${FOCUS_RING}`}
            >
              See work
            </a>
          </div>
        </div>

        <HeroIllustration />
      </div>
    </section>
  );
}
