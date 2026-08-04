"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CookieConsent from "@/components/CookieConsent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CONSENT_KEY = "analytics-consent";
type ConsentChoice = "granted" | "denied";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentChoice | null>(null);
  const lastTrackedPath = useRef(pathname);

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY);
    if (saved !== "granted" && saved !== "denied") return;
    const timer = window.setTimeout(() => setConsent(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!GA_ID || consent !== "granted" || typeof window.gtag !== "function") return;

    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    const search = window.location.search;
    const url = `${pathname}${search}`;
    window.gtag("config", GA_ID, {
      page_path: url,
    });
  }, [consent, pathname]);

  useEffect(() => {
    if (consent !== "granted") return;

    const trackLink = (event: MouseEvent) => {
      const target = event.target;
      const anchor = target instanceof Element ? target.closest("a") : null;
      if (!anchor || typeof window.gtag !== "function") return;
      const href = anchor.getAttribute("href") || "";
      if (href.startsWith("mailto:") || href.startsWith("tel:") || href.includes("wa.me/")) {
        const method = href.startsWith("mailto:") ? "email" : href.startsWith("tel:") ? "phone" : "whatsapp";
        window.gtag("event", "contact_click", { contact_method: method });
        return;
      }
      try {
        const url = new URL(anchor.href);
        if (url.origin !== window.location.origin) {
          window.gtag("event", "outbound_link_click", {
            link_domain: url.hostname,
            link_url: `${url.origin}${url.pathname}`,
          });
        }
      } catch {
        // Ignore non-URL links such as page anchors.
      }
    };

    document.addEventListener("click", trackLink);
    return () => document.removeEventListener("click", trackLink);
  }, [consent]);

  const saveConsent = (choice: ConsentChoice) => {
    window.localStorage.setItem(CONSENT_KEY, choice);
    setConsent(choice);
  };

  const resetConsent = () => {
    window.localStorage.removeItem(CONSENT_KEY);
    window.location.reload();
  };

  return (
    <>
      <CookieConsent choice={consent} onChoice={saveConsent} onReset={resetConsent} />
      {GA_ID && consent === "granted" ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname + window.location.search });
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
