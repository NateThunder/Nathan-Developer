"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

const ROTATION_MS = 8400;

type StatusTypewriterProps = {
  messages: string[];
};

export function StatusTypewriter({ messages }: StatusTypewriterProps) {
  const safeMessages = useMemo(
    () => messages.filter((message) => message.trim().length > 0),
    [messages],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (safeMessages.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % safeMessages.length);
    }, ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [safeMessages]);

  if (safeMessages.length === 0) {
    return null;
  }

  const activeMessage = safeMessages[activeIndex];
  const characterCount = Math.max(activeMessage.length, 1);
  const trackingExtraEm = Math.max(characterCount - 1, 0) * 0.16;

  return (
    <span
      key={activeMessage}
      className="typewriter-line"
      style={
        {
          "--characters": `${characterCount}ch`,
          "--steps": `${characterCount}`,
          "--tracking-extra": `${trackingExtraEm}em`,
        } as CSSProperties
      }
    >
      {activeMessage}
    </span>
  );
}
