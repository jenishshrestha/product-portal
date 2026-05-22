import { HeroSection } from "./components/HeroSection";
import { HomeHeader } from "./components/HomeHeader";
import { TechGrid } from "./components/TechGrid";

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HomeHeader />
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="container mx-auto max-w-7xl">
          <HeroSection />
          <TechGrid />
        </div>
      </main>
    </div>
  );
}
