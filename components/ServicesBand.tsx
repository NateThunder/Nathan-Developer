"use client";

import { useState } from "react";
import { PixelIcon, type PixelIconName } from "@/components/PixelIcon";
import { SectionVectorArt } from "@/components/SectionVectorArt";

type Service = {
  id: string;
  title: string;
  description: string;
  details: string;
  bullets: string[];
  icon: PixelIconName;
};

const services: Service[] = [
  {
    id: "strategy",
    title: "Strategy",
    description: "Positioning, messaging, and page structure planning.",
    details:
      "We map user goals to business outcomes so every section has a clear role.",
    bullets: [
      "Discovery and content hierarchy",
      "Offer clarity and CTA plan",
      "Audience-first page flow",
    ],
    icon: "strategy",
  },
  {
    id: "uiux",
    title: "UI/UX",
    description: "Visual direction, interaction patterns, and responsive design.",
    details:
      "Interface systems built for clarity on desktop and mobile, with consistency across pages.",
    bullets: [
      "Wireframes and visual system",
      "Interaction and states",
      "Mobile-first refinements",
    ],
    icon: "design",
  },
  {
    id: "build",
    title: "Build",
    description: "Production-ready front-end implementation and QA.",
    details:
      "Clean implementation with performance and accessibility checks before launch.",
    bullets: [
      "Fast-loading pages",
      "Semantic, accessible markup",
      "Launch QA checklist",
    ],
    icon: "build",
  },
  {
    id: "motion",
    title: "Motion",
    description: "Subtle interface motion to improve pacing and clarity.",
    details:
      "Motion is used intentionally to guide attention, not distract from content.",
    bullets: [
      "Meaningful transitions",
      "Micro-feedback on actions",
      "Reduced-motion support",
    ],
    icon: "motion",
  },
  {
    id: "maintenance",
    title: "Maintenance",
    description: "Ongoing updates, support, and iteration post-launch.",
    details:
      "Post-launch support keeps content current, stable, and aligned with growth goals.",
    bullets: [
      "Monthly updates and fixes",
      "Content and section changes",
      "Performance monitoring",
    ],
    icon: "maintenance",
  },
  {
    id: "agent",
    title: "AI Agent",
    description:
      "On-site assistant to qualify leads, answer key questions, and guide visitors to book a call.",
    details:
      "The agent can handle common sales questions, estimate ranges, and route qualified visitors.",
    bullets: [
      "Lead qualification prompts",
      "Pricing and timeline guidance",
      "Book-a-call handoff",
    ],
    icon: "agent",
  },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

export function ServicesBand() {
  const [openServiceId, setOpenServiceId] = useState<string>("agent");

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
              Tap a card to open deeper service details.
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
            const isOpen = openServiceId === service.id;

            return (
              <article
                key={service.id}
                className={`pixel-notch card-hover rounded-[22px] border-2 bg-[var(--color-bg-elevated)] p-5 sm:p-6 ${
                  warm
                    ? "border-[var(--color-accent-warm)] border-t-4"
                    : "border-[var(--color-border)] border-t-4"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenServiceId((prev) => (prev === service.id ? "" : service.id))
                  }
                  aria-expanded={isOpen}
                  aria-controls={`service-panel-${service.id}`}
                  className={`w-full text-left ${FOCUS_RING}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <PixelIcon
                      icon={service.icon}
                      className="service-icon h-8 w-8 text-[var(--color-accent)]"
                    />
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs font-semibold text-[var(--color-text)]">
                      {isOpen ? "-" : "+"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-[var(--color-text)]">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    {service.description}
                  </p>
                </button>

                <div
                  id={`service-panel-${service.id}`}
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "mt-4 grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm leading-7 text-[var(--color-muted)]">
                      {service.details}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--color-text)]">
                      {service.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="rounded-[10px] border border-[var(--color-border)]/65 bg-[var(--color-surface)] px-3 py-1.5"
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
