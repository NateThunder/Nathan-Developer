import Image from "next/image";

export function HeroIllustration() {
  return (
    <div className="pixel-notch relative z-[80] mx-auto w-full max-w-[620px] overflow-hidden rounded-[24px] border-2 border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 sm:rounded-[28px] sm:p-4">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[420px] overflow-hidden rounded-[16px] bg-[var(--color-surface)]">
        <Image
          src="/Nathan Headshot.jpg"
          alt="Nathan Somevi headshot"
          fill
          priority
          className="object-cover object-[50%_0%]"
          sizes="(min-width: 1024px) 420px, 90vw"
        />
      </div>
    </div>
  );
}
