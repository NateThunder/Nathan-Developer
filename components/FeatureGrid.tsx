import { PixelIcon, type PixelIconName } from "@/components/PixelIcon";
import { SectionVectorArt } from "@/components/SectionVectorArt";

type Feature = {
  title: string;
  description: string;
  icon: PixelIconName;
};

const features: Feature[] = [
  {
    title: "Conversion-first architecture",
    description:
      "Section flow, hierarchy, and call-to-action placement designed to guide decisions.",
    icon: "architecture",
  },
  {
    title: "Performance at launch",
    description:
      "Clean front-end implementation and optimized assets tuned for speed from day one.",
    icon: "performance",
  },
  {
    title: "Accessible by default",
    description:
      "Readable contrast, keyboard navigation, and semantic structure built into every page.",
    icon: "accessibility",
  },
  {
    title: "Editable content system",
    description:
      "Simple editing workflows so your team can maintain core pages without bottlenecks.",
    icon: "cms",
  },
];

export function FeatureGrid() {
  return (
    <section
      id="features"
      className="relative scroll-mt-24 border-y border-[var(--color-border)] bg-[var(--color-surface-alt)] py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-[660px]">
            <p className="mono-label text-[11px] text-[var(--color-accent)]">
              PRODUCT MINDSET
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text)] sm:text-4xl">
              Built like software, presented like a brand.
            </h2>
          </div>

          <SectionVectorArt
            variant="features"
            className="hidden h-[88px] w-[160px] rounded-[16px] border-2 border-[var(--color-border)] lg:block"
          />
        </div>

        <div className="feature-grid mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const warm = index % 2 === 1;

            return (
              <article
                key={feature.title}
                className={`pixel-notch card-hover rounded-[22px] border-2 bg-[var(--color-surface)] p-5 sm:p-6 ${
                  warm
                    ? "border-[var(--color-accent-warm)] border-t-4"
                    : "border-[var(--color-border)] border-t-4"
                }`}
              >
                <PixelIcon
                  icon={feature.icon}
                  className="feature-icon h-9 w-9 text-[var(--color-accent)]"
                />
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-[var(--color-text)]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
