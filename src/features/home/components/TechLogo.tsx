import { motion } from "motion/react";
import type { TechItem } from "../types";

interface TechLogoProps extends TechItem {
  delay?: number;
}

export function TechLogo({ icon, name, url, delay = 0 }: TechLogoProps) {
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.08 }}
      className="group flex flex-col items-center justify-center gap-2 relative outline-none"
      aria-label={name}
    >
      <div className="w-20 h-20 flex items-center justify-center">{icon}</div>
      <span className="text-foreground text-sm font-medium absolute -bottom-6 whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
        {name}
      </span>
    </motion.a>
  );
}
