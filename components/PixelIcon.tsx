import type { SVGProps } from "react";

export type PixelIconName =
  | "architecture"
  | "performance"
  | "accessibility"
  | "cms"
  | "strategy"
  | "design"
  | "build"
  | "motion"
  | "maintenance"
  | "agent";

const ICONS: Record<PixelIconName, string[]> = {
  architecture: [
    "011110",
    "010010",
    "010010",
    "010010",
    "010010",
    "011110",
  ],
  performance: [
    "001100",
    "011110",
    "110111",
    "100011",
    "011110",
    "001100",
  ],
  accessibility: [
    "001100",
    "011110",
    "001100",
    "011110",
    "110011",
    "100001",
  ],
  cms: [
    "111111",
    "100001",
    "101101",
    "101101",
    "100001",
    "111111",
  ],
  strategy: [
    "110011",
    "110011",
    "001100",
    "001100",
    "110011",
    "110011",
  ],
  design: [
    "111111",
    "100001",
    "101101",
    "101101",
    "100001",
    "111111",
  ],
  build: [
    "111100",
    "100100",
    "111100",
    "100100",
    "100111",
    "111001",
  ],
  motion: [
    "110000",
    "111000",
    "011100",
    "001110",
    "000111",
    "000011",
  ],
  maintenance: [
    "110011",
    "011110",
    "111111",
    "011110",
    "110011",
    "100001",
  ],
  agent: [
    "001100",
    "011110",
    "110011",
    "111111",
    "101101",
    "011110",
  ],
};

type PixelIconProps = {
  icon: PixelIconName;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "name">;

const CELL = 6;
const GAP = 2;
const GRID = 6;
const VIEW_BOX = GRID * CELL + (GRID - 1) * GAP;

export function PixelIcon({ icon, className, ...props }: PixelIconProps) {
  const rows = ICONS[icon];

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
      className={className}
      fill="none"
      {...props}
    >
      {rows.flatMap((row, rowIndex) =>
        row.split("").map((cell, columnIndex) => {
          if (cell !== "1") {
            return null;
          }

          return (
            <rect
              key={`${rowIndex}-${columnIndex}`}
              x={columnIndex * (CELL + GAP)}
              y={rowIndex * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={1}
              fill="currentColor"
            />
          );
        })
      )}
    </svg>
  );
}
