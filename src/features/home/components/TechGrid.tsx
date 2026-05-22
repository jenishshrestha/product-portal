import { technologies } from "../lib/tech-data";
import { TechLogo } from "./TechLogo";

export function TechGrid() {
  return (
    <section
      aria-label="Technology stack"
      className="flex flex-wrap justify-center items-center gap-10 max-w-5xl mx-auto pb-8"
    >
      {technologies.map((tech, index) => (
        <TechLogo
          key={tech.name}
          icon={tech.icon}
          name={tech.name}
          url={tech.url}
          delay={index * 0.03}
        />
      ))}
    </section>
  );
}
