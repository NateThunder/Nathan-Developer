import Image from "next/image";
import { SectionVectorArt } from "@/components/SectionVectorArt";

type Project = {
  name: string;
  url: string;
  screenshot: string;
  alt: string;
};

const projects: Project[] = [
  {
    name: "stem-player",
    url: "https://stem-player.netlify.app/",
    screenshot: "/work/stem-player.png",
    alt: "Stem Player website screenshot",
  },
  {
    name: "team-church-glasgow",
    url: "https://team-church-glasgow.netlify.app/",
    screenshot: "/work/team-church-glasgow.png",
    alt: "Team Church Glasgow website screenshot",
  },
  {
    name: "zerua",
    url: "https://zerua.netlify.app/",
    screenshot: "/work/zerua-dashboard.png",
    alt: "Zerua website screenshot",
  },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

export function WorkShowcase() {
  return (
    <section
      id="work"
      className="scroll-mt-24 border-y border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-[680px]">
            <p className="mono-label text-[11px] text-[var(--color-accent-warm)]">
              WORK
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text)] sm:text-4xl">
              Live websites
            </h2>
          </div>

          <SectionVectorArt
            variant="work"
            className="hidden h-[88px] w-[160px] rounded-[16px] border-2 border-[var(--color-border)] lg:block"
          />
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => {
            const warm = index % 2 === 1;

            return (
              <a
                key={project.url}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${project.name} in a new tab`}
                className={`pixel-notch card-hover group rounded-[22px] border-2 bg-[var(--color-surface)] p-4 sm:p-5 ${
                  warm
                    ? "border-[var(--color-accent-warm)] border-t-4"
                    : "border-[var(--color-border)] border-t-4"
                } ${FOCUS_RING}`}
              >
                <div className="rounded-[12px] border-2 border-[var(--color-border)] bg-[#183847] p-2">
                  <div className="mb-2 flex items-center gap-1.5 px-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent-warm)]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#89aeb8]" />
                  </div>

                  <div className="relative aspect-[16/9] overflow-hidden rounded-[8px] border border-[var(--color-border)]/70 bg-[#0f2530]">
                    <Image
                      src={project.screenshot}
                      alt={project.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover object-top transition duration-300 group-hover:scale-[1.015]"
                    />
                  </div>
                </div>

                <p className="mt-4 text-2xl font-semibold tracking-[-0.015em] text-[var(--color-text)] sm:text-[1.8rem]">
                  {project.name}
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
