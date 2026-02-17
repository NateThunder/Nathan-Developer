import { SectionVectorArt } from "@/components/SectionVectorArt";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "They turned our scattered ideas into a site that finally explains what we do and why it matters.",
    author: "Alex Rivera",
    role: "Operations Lead, Orbit Logistics",
  },
  {
    quote:
      "The process was clear, the delivery was fast, and our new website instantly felt more credible.",
    author: "Jamie Brooks",
    role: "Founder, Harbor Studio",
  },
  {
    quote:
      "Design quality was strong, but what stood out most was the structure and conversion thinking.",
    author: "Morgan Lee",
    role: "Marketing Director, Northline Health",
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="scroll-mt-24 border-y border-[var(--color-border)] bg-[var(--color-surface-alt)] py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-[680px]">
            <p className="mono-label text-[11px] text-[var(--color-accent-warm)]">
              TESTIMONIALS
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text)] sm:text-4xl">
              Trusted by teams that need precision and speed.
            </h2>
          </div>

          <SectionVectorArt
            variant="testimonials"
            className="hidden h-[88px] w-[160px] rounded-[16px] border-2 border-[var(--color-border)] lg:block"
          />
        </div>

        <div className="testimonial-grid mt-8 grid gap-4 sm:mt-10 md:grid-cols-3">
          {testimonials.map((item, index) => {
            const warm = index % 2 === 1;

            return (
              <article
                key={item.author}
                className={`pixel-notch card-hover rounded-[22px] border-2 bg-[var(--color-surface)] p-5 sm:p-6 ${
                  warm
                    ? "border-[var(--color-accent-warm)] border-t-4"
                    : "border-[var(--color-border)] border-t-4"
                }`}
              >
                <p
                  className={`quote-accent text-sm leading-7 ${
                    warm
                      ? "text-[var(--color-accent-warm)]"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  "{item.quote}"
                </p>
                <p className="mt-6 text-sm font-semibold text-[var(--color-text)]">
                  {item.author}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  {item.role}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
