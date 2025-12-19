import { type CSSProperties } from "react"
import { ROUTES, navigateTo } from "../routes"
import type { ViewMode } from "../ui/types"

export function Nav({
  theme,
  viewMode,
}: {
  theme: {
    bg: string
    text: string
    subtext: string
    border: string
    panel: string
    divider: string
    badgeBg: string
    primary: string
    primaryText: string
    danger: string
  }
  viewMode: ViewMode
}) {
  const container: CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: theme.bg,
    borderBottom: `1px solid ${theme.divider}`,
    padding: "8px 0",
    marginBottom: 8,
  }
  const tabs: Array<{ key: ViewMode; label: string; href: string }> = [
    { key: "home", label: "Home", href: ROUTES.home },
    { key: "authn", label: "Connect", href: ROUTES.authn },
    { key: "authz", label: "Authorize", href: ROUTES.authz },
  ]
  return (
    <div style={container}>
      <div style={{ display: "flex", gap: 8 }}>
        {tabs.map(t => {
          const active = viewMode === t.key
            return (
              <a
                key={t.key}
                href={t.href}
                onClick={e => {
                  e.preventDefault()
                  navigateTo(t.href)
                }}
                style={{
                textDecoration: "none",
                padding: "6px 10px",
                borderRadius: 8,
                border: `1px solid ${active ? theme.primary : theme.border}`,
                background: active ? theme.primary : theme.panel,
                color: active ? theme.primaryText : theme.text,
                fontWeight: active ? 700 : 500,
                fontSize: 13,
              }}
            >
              {t.label}
            </a>
          )
        })}
      </div>
    </div>
  )
}


