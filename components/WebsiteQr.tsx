"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

const WEBSITE_URL = "https://nathansomevi.dev";

export function WebsiteQr() {
  const [qrCodeSrc, setQrCodeSrc] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function generateQrCode() {
      const dataUrl = await QRCode.toDataURL(WEBSITE_URL, {
        width: 192,
        margin: 1,
        color: {
          dark: "#1a222e",
          light: "#00000000",
        },
      });

      if (!cancelled) {
        setQrCodeSrc(dataUrl);
      }
    }

    void generateQrCode();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!qrCodeSrc) {
    return (
      <div className="flex h-48 w-48 items-center justify-center rounded-[16px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-center text-xs text-[var(--color-muted)]">
        Loading QR code...
      </div>
    );
  }

  return (
    <a
      href={WEBSITE_URL}
      target="_blank"
      rel="noreferrer"
      className="block rounded-[16px] border-2 border-[var(--color-accent-warm)] bg-[var(--color-text)] p-3 transition hover:-translate-y-0.5 hover:brightness-105"
      aria-label="Open nathansomevi.dev"
    >
      <img
        src={qrCodeSrc}
        alt="QR code for nathansomevi.dev"
        width={192}
        height={192}
        className="block h-auto w-full"
      />
    </a>
  );
}
