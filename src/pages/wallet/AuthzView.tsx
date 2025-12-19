import { Nav } from "../../components/Nav"
import type { ViewMode } from "../../ui/types"

export function AuthzView({
  theme,
  darkMode,
  viewMode,
  signable,
  address,
  hasAddress,
  onApprove,
  onDeny,
}: {
  theme: any
  darkMode: boolean
  viewMode: ViewMode
  appMeta: { name?: string; icon?: string; url?: string }
  signable?: any
  address: string
  hasAddress: boolean
  onApprove: () => void
  onDeny: () => void
}) {
  const pageStyle: any = {
    minHeight: "auto",
    display: "block",
    background: theme.bg,
    padding: 8,
    fontFamily: "ui-sans-serif,system-ui",
    overflowX: "hidden",
  }
  const cardStyle: any = {
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
  const contentStyle: any = {
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
  }
  const buttonStyle: any = {
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: theme.panel,
    cursor: "pointer",
    color: theme.text,
  }
  const buttonPrimary: any = {
    ...buttonStyle,
    background: theme.primary,
    color: theme.primaryText,
    border: `1px solid ${theme.primary}`,
  }
  const buttonDanger: any = {
    ...buttonStyle,
    background: darkMode ? "transparent" : "#fff",
    color: theme.danger,
    border: `1px solid ${theme.danger}`,
  }
  const footerStyle: any = {
    position: "sticky",
    bottom: 0,
    background: theme.bg,
    borderTop: `1px solid ${theme.divider}`,
    padding: 12,
    marginTop: 16,
  }
  const mono: any = {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 12,
  }

  const v = signable?.voucher as any
  const cadence: string = v?.cadence || ""
  const cadencePreview = cadence.split("\n").slice(0, 16).join("\n")

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <Nav theme={theme} viewMode={viewMode} />
        <div style={{ display: "grid", gap: 10, ...contentStyle }}>
          {cadence && (
            <div>
              <div style={{ fontWeight: 600, color: "#333", marginBottom: 6 }}>Cadence</div>
              <pre
                style={{
                  ...mono,
                  background: darkMode ? "#0f1420" : "#f8f9fa",
                  color: theme.text,
                  padding: 8,
                  borderRadius: 8,
                  overflowX: "auto",
                  textAlign: "left",
                }}
              >
                {cadencePreview}
              </pre>
            </div>
          )}
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 600, color: theme.text }}>Details</div>
            <div style={{ fontSize: 13, color: theme.text }}>
              <span style={{ fontWeight: 600 }}>Payer:</span> {v?.payer}
            </div>
            <div style={{ fontSize: 13, color: theme.text }}>
              <span style={{ fontWeight: 600 }}>Proposer:</span> {v?.proposalKey?.address}
            </div>
            <div style={{ fontSize: 13, color: theme.text }}>
              <span style={{ fontWeight: 600 }}>Authorizers:</span> {(v?.authorizers || []).join(", ")}
            </div>
            {typeof v?.computeLimit === "number" && (
              <div style={{ fontSize: 13, color: theme.text }}>
                <span style={{ fontWeight: 600 }}>Compute limit:</span> {v.computeLimit}
              </div>
            )}
            {Array.isArray(v?.arguments) && v.arguments.length > 0 && (
              <div style={{ fontSize: 13, color: theme.text }}>
                <span style={{ fontWeight: 600 }}>Arguments:</span> {v.arguments.length}
              </div>
            )}
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          <div>Signing as: {hasAddress ? address : "no account"}</div>
        </div>
        <div style={footerStyle}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onDeny} style={buttonDanger}>Deny</button>
            <button onClick={onApprove} style={buttonPrimary}>Approve Transaction</button>
          </div>
        </div>
      </div>
    </div>
  )
}


