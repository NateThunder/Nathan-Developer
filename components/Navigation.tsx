"use client";

import { type MouseEvent, useState } from "react";
import { BookCallButton } from "@/components/BookCallButton";

const links = [
  { href: "#features", label: "Features" },
  { href: "#services", label: "Services" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  const handleAnchorClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const targetId = href.replace(/^#/, "");
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    event.preventDefault();
    closeMenu();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const header = document.querySelector("header");
        const headerHeight =
          header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
        const targetTop =
          window.scrollY + target.getBoundingClientRect().top - headerHeight - 12;

        window.history.pushState(null, "", href);
        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: "smooth",
        });
      });
    });
  };

  return (
    <header className="sticky top-0 z-[90] border-b border-[var(--color-border)] bg-[var(--color-band)]">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          className={`inline-flex items-center gap-3 rounded-full text-[var(--color-text)] ${FOCUS_RING}`}
          aria-label="Go to top of page"
        >
          <span className="pixel-notch relative inline-flex h-9 w-9 items-center justify-center rounded-[10px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)]">
            <span className="grid grid-cols-2 gap-[2px]">
              <span className="h-[4px] w-[4px] bg-current" />
              <span className="h-[4px] w-[4px] bg-current" />
              <span className="h-[4px] w-[4px] bg-current" />
              <span className="h-[4px] w-[4px] bg-current" />
            </span>
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            &lt;SOMEVI_LABS&gt;
          </span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleAnchorClick(event, link.href)}
              className={`text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-accent-soft)] ${FOCUS_RING}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <BookCallButton
            className={`pixel-notch inline-flex items-center justify-center rounded-full border-2 border-[var(--color-accent-deep)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[#1f2023] transition hover:brightness-105 ${FOCUS_RING}`}
          />
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsOpen((value) => !value)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] md:hidden ${FOCUS_RING}`}
        >
          <span className="sr-only">Toggle navigation</span>
          <span className="relative h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-[2px] w-5 bg-current transition ${
                isOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-[2px] w-5 bg-current transition ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-[14px] h-[2px] w-5 bg-current transition ${
                isOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`${isOpen ? "block" : "hidden"} border-t-2 border-[var(--color-border)] bg-[var(--color-bg-elevated)] md:hidden`}
      >
        <nav
          aria-label="Mobile"
          className="mx-auto grid w-full max-w-[1200px] gap-1 px-4 py-4 sm:px-6"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleAnchorClick(event, link.href)}
              className={`rounded-xl px-3 py-3 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] ${FOCUS_RING}`}
            >
              {link.label}
            </a>
          ))}

          <BookCallButton
            onOpen={closeMenu}
            className={`mt-2 inline-flex w-full items-center justify-center rounded-full border-2 border-[var(--color-accent-deep)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[#2c2f2d] ${FOCUS_RING}`}
          />
        </nav>
      </div>
    </header>
  );
}
