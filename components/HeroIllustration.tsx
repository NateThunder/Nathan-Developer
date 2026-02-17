export function HeroIllustration() {
  return (
    <div className="pixel-notch relative mx-auto w-full max-w-[620px] overflow-hidden rounded-[24px] border-2 border-[var(--color-border)] bg-[#264f5d] p-3 sm:rounded-[28px] sm:p-4">
      <svg
        aria-hidden="true"
        viewBox="0 0 560 420"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="#7ea9b5" strokeWidth="1" />
          </pattern>

          <pattern id="dither" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill="#d3e4ea" />
            <rect x="4" y="4" width="2" height="2" fill="#b6d1da" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="560" height="420" rx="24" fill="#204754" />

        <circle cx="392" cy="132" r="130" fill="#4c7581" className="hero-orb" />
        <circle cx="392" cy="132" r="98" fill="#6d9aa5" />
        <circle cx="392" cy="132" r="68" fill="#d9be98" />
        <circle cx="392" cy="132" r="38" fill="#f2e3cc" />

        <rect x="0" y="0" width="560" height="420" fill="url(#grid)" opacity="0.24" />

        <g>
          <path d="M78 320H526" stroke="#a8c9d4" strokeWidth="4" />
          <path d="M90 298H512" stroke="#a8c9d4" strokeWidth="3" />
          <path d="M102 344H538" stroke="#a8c9d4" strokeWidth="3" />
        </g>

        <g>
          <path d="M212 330L272 290L336 330V394H212V330Z" fill="#233744" />
          <path d="M212 330L272 290V394H212V330Z" fill="#1a2d39" />
          <path d="M272 290L336 330V394H272V290Z" fill="#2f4554" />
          <rect x="262" y="336" width="20" height="58" fill="#d57055" />
          <rect x="246" y="272" width="52" height="18" fill="#f3dfc5" />
          <rect x="236" y="238" width="72" height="34" fill="#dc7958" />
          <path d="M228 238L272 198L316 238H228Z" fill="#f3dfc5" />
          <rect x="268" y="198" width="8" height="40" fill="#f3dfc5" />
        </g>

        <g>
          <path d="M110 290L184 246L258 290L184 334Z" fill="none" stroke="#c0dce5" strokeWidth="3" />
          <path d="M110 290V214L184 170L184 246" fill="none" stroke="#c0dce5" strokeWidth="3" />
          <path d="M184 246L258 290V214L184 170L110 214" fill="none" stroke="#c0dce5" strokeWidth="3" />
        </g>

        <g fill="#f2d5a2">
          <rect x="20" y="20" width="8" height="8" />
          <rect x="28" y="20" width="8" height="8" />
          <rect x="20" y="28" width="8" height="8" />

          <rect x="532" y="384" width="8" height="8" />
          <rect x="524" y="384" width="8" height="8" />
          <rect x="532" y="376" width="8" height="8" />
        </g>

        <rect x="0" y="0" width="560" height="420" fill="url(#dither)" opacity="0.03" />
      </svg>

      <div className="pointer-events-none absolute bottom-4 left-4 hidden items-center gap-2 rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-accent)] sm:flex">
        vector / pixel blend
      </div>
    </div>
  );
}
