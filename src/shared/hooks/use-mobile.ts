import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Lazy-init from the current viewport so the first paint doesn't flash the
  // desktop layout on mobile devices. No SSR in this app, so `window` is
  // always defined inside useState's initializer.
  const [isMobile, setIsMobile] = React.useState<boolean>(
    () => window.innerWidth < MOBILE_BREAKPOINT,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
