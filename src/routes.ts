export type ViewMode = "home" | "authn" | "authz"

export const ROUTES = {
  home: "/",
  authn: "/authn",
  authz: "/authz",
} as const

export function pathToView(pathname: string): ViewMode {
  const p = (pathname || "/").toLowerCase()
  if (p.startsWith(ROUTES.authn)) return "authn"
  if (p.startsWith(ROUTES.authz)) return "authz"
  return "home"
}

export function viewToPath(v: ViewMode): string {
  return ROUTES[v]
}

export function navigateTo(path: string) {
  try {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path)
    }
    window.dispatchEvent(new PopStateEvent("popstate"))
  } catch {}
}


