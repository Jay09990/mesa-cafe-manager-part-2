// Adds a short, reduced-motion-aware entrance effect to a semantic section.
"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useInView } from "@/features/marketing/hooks/useInView";

type AnimatedSectionProps = ComponentPropsWithoutRef<"section">;

export function AnimatedSection({ className = "", children, ...sectionProps }: AnimatedSectionProps) {
  const { ref, inView } = useInView();
  const entranceState = inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0";

  return (
    <section
      {...sectionProps}
      ref={ref}
      className={`transition-all duration-200 motion-reduce:opacity-100 motion-reduce:transition-none motion-reduce:transform-none ${entranceState} ${className}`}
    >
      {children}
    </section>
  );
}
