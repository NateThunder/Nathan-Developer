import { PixelIcon, type PixelIconName } from "@/components/PixelIcon";
import { SectionVectorArt } from "@/components/SectionVectorArt";

type Service = {
  title: string;
  description: string;
  icon: PixelIconName;
};

const services: Service[] = [
  {
    title: "Strategy",
    description: "Positioning, messaging, and page structure planning.",
    icon: "strategy",
  },
  {
    title: "UI/UX",
    description: "Visual direction, interaction patterns, and responsive design.",
    icon: "design",
  },
  {
    title: "Build",
    description: "Production-ready front-end implementation and QA.",
    icon: "build",
  },
  {
    title: "Motion",
    description: "Subtle interface motion to improve pacing and clarity.",
    icon: "motion",
  },
  {
    title: "Maintenance",
    description: "Ongoing updates, support, and iteration post-launch.",
    icon: "maintenance",
  },
  {
    title: "AI Agent",
    description:
      "On-site assistant to qualify leads, answer key questions, and guide visitors to book a call.",
    icon: "agent",
  },
];

export function ServicesBand() {
  return (
    <section
      id="services"
      className="scroll-mt-24 border-y-2 border-[var(--color-border)] bg-[var(--color-band)] py-12 sm:py-16 lg:py-20"
      aria-label="Services"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-6 sm:mb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-[600px]">
              <p className="mono-label text-[11px] text-[var(--color-accent-warm)]">
                SERVICES
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text)] sm:text-4xl">
                A focused end-to-end web design stack.
              </h2>
            </div>
            <p className="max-w-[420px] text-sm leading-7 text-[var(--color-muted)]">
              From strategy through maintenance, each phase is designed to keep
              your site clear, scalable, and easy to manage.
            </p>
          </div>

          <SectionVectorArt
            variant="services"
            className="hidden h-[88px] w-[160px] rounded-[16px] border-2 border-[var(--color-border)] lg:block"
          />
        </div>

        <div className="services-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const warm = index % 2 === 1;

            return (
              <article
                key={service.title}
                className={`pixel-notch card-hover rounded-[22px] border-2 bg-[var(--color-bg-elevated)] p-5 sm:p-6 ${
                  warm
                    ? "border-[var(--color-accent-warm)] border-t-4"
                    : "border-[var(--color-border)] border-t-4"
                }`}
              >
                <PixelIcon
                  icon={service.icon}
                  className="service-icon h-8 w-8 text-[var(--color-accent)]"
                />
                <h3 className="mt-4 text-lg font-semibold text-[var(--color-text)]">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  {service.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
