import { type CSSProperties } from "react"
import { Nav } from "../../components/Nav"
import type { ViewMode, Account } from "../../ui/types"

export function AuthnView({
  theme,
  darkMode,
  viewMode,
  accounts,
  address,
  isRegistering,
  hasCredential,
  maskedSelectedCred,
  uiError,
  onSelectAddress,
  onRegister,
  onDeny,
  onApprove,
}: {
  theme: any
  darkMode: boolean
  viewMode: ViewMode
  appMeta: { name?: string; icon?: string; url?: string }
  accounts: Array<Account>
  address: string
  isRegistering: boolean
  hasCredential: boolean
  maskedSelectedCred: string
  uiError?: string
  onSelectAddress: (addr: string) => void
  onRegister: () => void
  onDeny: () => void
  onApprove: () => void
}) {
  const pageStyle: CSSProperties = {
    minHeight: "auto",
    display: "block",
    background: theme.bg,
    padding: 8,
    fontFamily: "ui-sans-serif,system-ui",
    overflowX: "hidden",
  }
  const cardStyle: CSSProperties = {
    background: "transparent",
    borderRadius: 0,
    width: "100%",
    maxWidth: "640px",
    maxHeight: "none",
    overflow: "visible",
    boxShadow: "none",
    padding: 0,
    margin: "0 auto",
  }
  const contentStyle: CSSProperties = {
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
  }
  const buttonStyle: CSSProperties = {
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: theme.panel,
    cursor: "pointer",
    color: theme.text,
  }
  const buttonPrimary: CSSProperties = {
    ...buttonStyle,
    background: theme.primary,
    color: theme.primaryText,
    border: `1px solid ${theme.primary}`,
  }
  const buttonDanger: CSSProperties = {
    ...buttonStyle,
    background: darkMode ? "transparent" : "#fff",
    color: theme.danger,
    border: `1px solid ${theme.danger}`,
  }
  const badgeStyle: CSSProperties = {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: 6,
    background: theme.badgeBg,
    fontSize: 12,
    color: theme.text,
  }
  const shimmer: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    background: darkMode ? "#101623" : "#e9ecef",
  }
  const shimmerAfter: CSSProperties = {
    content: '""' as any,
    position: "absolute",
    top: 0,
    left: -200,
    height: "100%",
    width: 200,
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
    animation: "shimmer 1.2s infinite",
  }
  const formatFlow = (bal?: string | number) => {
    if (bal == null) return "—"
    const raw = String(bal).trim()
    if (raw === "") return "—"
    if (raw.includes(".")) {
      const [i, f = ""] = raw.split(".")
      const intPart = i.replace(/^0+(?=\d)/, "") || "0"
      const fracTrimmed = f.replace(/0+$/, "")
      return fracTrimmed ? `${intPart}.${fracTrimmed}` : intPart
    }
    const s = raw.replace(/^0+/, "") || "0"
    const fracLen = 8
    if (s === "0") return "0"
    if (s.length <= fracLen) {
      const frac = s.padStart(fracLen, "0").replace(/0+$/, "")
      return frac ? `0.${frac}` : "0"
    }
    const intPart = s.slice(0, s.length - fracLen).replace(/^0+(?=\d)/, "") || "0"
    const fracPart = s.slice(-fracLen).replace(/0+$/, "")
    return fracPart ? `${intPart}.${fracPart}` : intPart
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <Nav theme={theme} viewMode={viewMode} />
        <div style={{ display: "grid", gap: 10, ...contentStyle }}>
          <div>
            <div style={{ fontWeight: 600, color: theme.text, marginBottom: 6 }}>
              Choose an account
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {isRegistering && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: 10,
                    background: theme.bg,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      ...shimmer,
                    }}
                  >
                    <div style={shimmerAfter} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ height: 12, borderRadius: 4, ...shimmer }}>
                      <div style={shimmerAfter} />
                    </div>
                    <div
                      style={{
                        height: 10,
                        marginTop: 6,
                        width: "60%",
                        borderRadius: 4,
                        ...shimmer,
                      }}
                    >
                      <div style={shimmerAfter} />
                    </div>
                  </div>
                  <span style={{ ...badgeStyle, opacity: 0.7 }}>Creating…</span>
                </div>
              )}
              {accounts.length === 0 && (
                <div style={{ color: theme.subtext, fontSize: 13 }}>
                  No accounts found.
                </div>
              )}
              {accounts.map((acc: Account) => {
                const selected = address?.toLowerCase() === acc.address.toLowerCase()
                return (
                  <button
                    key={acc.address}
                    onClick={() => onSelectAddress(acc.address)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      textAlign: "left",
                      background: selected ? (darkMode ? "#16203a" : "#eef1ff") : theme.bg,
                      border: selected
                        ? `1px solid ${darkMode ? "#7b93ff" : "#4c6fff"}`
                        : `1px solid ${theme.border}`,
                      padding: 10,
                      borderRadius: 10,
                      cursor: "pointer",
                      color: theme.text,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: "inline-flex",
                        width: 28,
                        height: 28,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        border: `1px solid ${theme.border}`,
                        background: theme.panel,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke={theme.text} />
                        <path d="M4 20c0-3.3137 3.5817-6 8-6s8 2.6863 8 6" stroke={theme.text} />
                      </svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: theme.text, fontSize: 14 }}>
                        {acc.address}
                      </div>
                      <div style={{ fontSize: 12, color: theme.subtext, marginTop: 2 }}>
                        Balance: {formatFlow(acc.balance)} FLOW
                      </div>
                    </div>
                    {selected && (
                      <span
                        style={{
                          ...badgeStyle,
                          background: darkMode ? "#7b93ff" : "#4c6fff",
                          color: darkMode ? "#0b0d12" : "#fff",
                        }}
                      >
                        Selected
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          {!hasCredential && (
            <div style={{ color: theme.subtext, fontSize: 13 }}>
              No passkey found. Create one to continue.
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            {!hasCredential && (
              <button onClick={onRegister} style={buttonStyle}>
                Create New Passkey
              </button>
            )}
            {hasCredential && (
              <button onClick={onRegister} style={buttonStyle}>
                Add Another Passkey
              </button>
            )}
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: theme.subtext }}>
          <div>Account: {address ? address : "none"}</div>
          <div>Passkey: {maskedSelectedCred}</div>
          {uiError && <div style={{ color: theme.danger, marginTop: 8 }}>{uiError}</div>}
        </div>
        <div style={{ position: "sticky", bottom: 0, background: theme.bg, borderTop: `1px solid ${theme.divider}`, padding: 12, marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onDeny} style={buttonDanger}>
              Deny
            </button>
            <button onClick={onApprove} style={buttonPrimary}>
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


