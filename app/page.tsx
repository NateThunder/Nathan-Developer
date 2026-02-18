import { ChatAgentWidget } from "@/components/ChatAgentWidget";
import { FeatureGrid } from "@/components/FeatureGrid";
import { Hero } from "@/components/Hero";
import { Navigation } from "@/components/Navigation";
import { ServicesBand } from "@/components/ServicesBand";
import { SiteFooter } from "@/components/SiteFooter";
import { WorkShowcase } from "@/components/WorkShowcase";

export default function Home() {
  return (
    <div className="studio-page min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Navigation />
      <main>
        <Hero />
        <FeatureGrid />
        <ServicesBand />
        <WorkShowcase />
      </main>
      <SiteFooter />
      <ChatAgentWidget />
    </div>
  );
}
