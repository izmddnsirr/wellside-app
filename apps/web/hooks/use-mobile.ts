import * as React from "react"

const MOBILE_BREAKPOINT = 768

const getIsMobile = () => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches

const subscribeToMobileChanges = (callback: () => void) => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

  mql.addEventListener("change", callback)

  return () => mql.removeEventListener("change", callback)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileChanges,
    getIsMobile,
    () => false
  )
}
