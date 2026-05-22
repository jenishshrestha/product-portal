import { HeubertLogo } from "./logos/HeubertLogo";

export function HeroSection() {
  return (
    <section className="flex flex-col items-center mb-16">
      <div className="w-[200px] mb-6">
        <HeubertLogo />
      </div>
      <h1 className="text-foreground text-xl md:text-2xl font-light tracking-wide text-center motion-safe:animate-fade-in-up motion-safe:[animation-delay:0.2s]">
        The React + AI Stack for 2026
      </h1>
    </section>
  );
}
