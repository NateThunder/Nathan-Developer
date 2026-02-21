type SectionVectorArtVariant =
  | "features"
  | "services"
  | "testimonials"
  | "work"
  | "footer";

type SectionVectorArtProps = {
  variant: SectionVectorArtVariant;
  className?: string;
};

const VARIANT_COLORS: Record<
  SectionVectorArtVariant,
  {
    background: string;
    shapeA: string;
    shapeB: string;
    line: string;
    pixel: string;
  }
> = {
  features: {
    background: "#222d3c",
    shapeA: "#cbd5e0",
    shapeB: "#e77756",
    line: "#a0aec0",
    pixel: "#ff8c69",
  },
  services: {
    background: "#202a38",
    shapeA: "#cbd5e0",
    shapeB: "#e77756",
    line: "#a0aec0",
    pixel: "#ff8c69",
  },
  testimonials: {
    background: "#222d3c",
    shapeA: "#cbd5e0",
    shapeB: "#e77756",
    line: "#a0aec0",
    pixel: "#ff8c69",
  },
  work: {
    background: "#202a38",
    shapeA: "#cbd5e0",
    shapeB: "#e77756",
    line: "#a0aec0",
    pixel: "#ff8c69",
  },
  footer: {
    background: "#202a38",
    shapeA: "#cbd5e0",
    shapeB: "#e77756",
    line: "#a0aec0",
    pixel: "#ff8c69",
  },
};

export function SectionVectorArt({
  variant,
  className = "",
}: SectionVectorArtProps) {
  const colors = VARIANT_COLORS[variant];

  return (
    <div aria-hidden="true" className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 160 88"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="160" height="88" fill={colors.background} />

        <circle cx="122" cy="30" r="24" fill={colors.shapeA} opacity="0.94" />
        <circle cx="122" cy="30" r="12" fill={colors.background} />

        <path
          d="M18 68H146M18 56H146M26 44H146"
          stroke={colors.line}
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path d="M36 64L56 44L76 64V82H36V64Z" fill={colors.shapeB} />
        <path d="M56 44L76 64V82H56V44Z" fill={colors.background} />

        <path
          d="M16 40L34 30L52 40L34 50Z"
          fill="none"
          stroke={colors.line}
          strokeWidth="2"
        />
        <path
          d="M16 40V24L34 14L34 30"
          fill="none"
          stroke={colors.line}
          strokeWidth="2"
        />
        <path
          d="M34 30L52 40V24L34 14L16 24"
          fill="none"
          stroke={colors.line}
          strokeWidth="2"
        />

        <g fill={colors.pixel}>
          <rect x="8" y="8" width="4" height="4" />
          <rect x="12" y="8" width="4" height="4" />
          <rect x="8" y="12" width="4" height="4" />

          <rect x="148" y="72" width="4" height="4" />
          <rect x="144" y="72" width="4" height="4" />
          <rect x="148" y="68" width="4" height="4" />
        </g>
      </svg>
    </div>
  );
}
