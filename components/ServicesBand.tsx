"use client";

import { type MouseEvent, useState } from "react";
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
    title: "Professional websites",
    description: "A website shaped around your business, clients, and goals. From £1,500.",
    details:
      "We work out what your customers need to see and do, then build a website that makes your business easy to choose.",
    bullets: [
      "Clear services and messaging",
      "Built for phones and desktops",
      "Enquiry-focused page structure",
    ],
    icon: "strategy",
  },
  {
    id: "uiux",
    title: "Design that builds trust",
    description: "A professional online presence that reflects the quality of your work.",
    details:
      "Your website will look considered, feel simple to use, and give customers confidence before they contact you.",
    bullets: [
      "Designed around your brand",
      "Clear calls to action",
      "Easy for visitors to use",
    ],
    icon: "design",
  },
  {
    id: "build",
    title: "Fast, solid foundations",
    description: "A reliable website built to load quickly and work properly.",
    details:
      "Everything is built carefully behind the scenes, with performance, security, and a smooth launch covered.",
    bullets: [
      "Fast-loading pages",
      "Search-ready foundations",
      "A smooth, supported launch",
    ],
    icon: "build",
  },
  {
    id: "motion",
    title: "Content you can manage",
    description: "A custom content management system, set up around how your business works.",
    details:
      "Update services, news, products, galleries, or team details without needing to touch the website code.",
    bullets: [
      "Made for your day-to-day updates",
      "Simple editing experience",
      "No unnecessary complexity",
    ],
    icon: "motion",
  },
  {
    id: "maintenance",
    title: "Booking and payments",
    description: "Let customers pay, reserve, or enquire online without friction.",
    details:
      "Where it makes sense for your business, we can connect secure payment and booking tools directly to your website.",
    bullets: [
      "Stripe or PayPal payments",
      "Booking and enquiry flows",
      "Secure, practical integrations",
    ],
    icon: "maintenance",
  },
  {
    id: "agent",
    title: "Dashboards and support",
    description:
      "Optional dashboards, practical automations, and ongoing support as your business grows.",
    details:
      "When your website needs to do more, we can add client dashboards, simple workflows, or reliable ongoing support.",
    bullets: [
      "Client dashboards and portals",
      "Simple automations",
      "Ongoing website support",
    ],
    icon: "agent",
  },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

export function ServicesBand() {
  const [openServiceId, setOpenServiceId] = useState<string>("");

  const handleSectionClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;

    if (!target.closest("[data-service-card='true']")) {
      setOpenServiceId("");
    }
  };

  return (
    <section
      id="services"
      onClick={handleSectionClick}
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
                Everything your website needs to work harder for your business.
              </h2>
            </div>
            <p className="max-w-[420px] text-sm leading-7 text-[var(--color-muted)]">
              Start with a professional website, then add bookings, ecommerce, dashboards, or support when it makes sense.
            </p>
          </div>

          <SectionVectorArt
            variant="services"
            className="hidden h-[88px] w-[160px] rounded-[16px] border-2 border-[var(--color-border)] lg:block"
          />
        </div>

        <div className="services-grid grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const isOpen = openServiceId === service.id;

            return (
              <article
                key={service.id}
                data-service-card="true"
                className="pixel-notch card-hover rounded-[22px] border-2 border-[var(--color-border)] border-t-4 bg-[var(--color-bg-elevated)] p-5 sm:p-6"
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
