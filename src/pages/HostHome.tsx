import {useCallback, useState} from "react"
import {FlowProvider, useFlowClient, useFlowCurrentUser, useFlowMutate, useFlowTransactionStatus} from "@onflow/react-sdk"

type ViewResponse = { type: string; status?: string; reason?: string | null; data?: any }

function HostContent() {
  const [lastResponse, setLastResponse] = useState<ViewResponse | undefined>()
  const client = useFlowClient()
  const {user, authenticate, unauthenticate} = useFlowCurrentUser()
  const {mutate, data: txId, isPending, error} = useFlowMutate()
  const {transactionStatus} = useFlowTransactionStatus({id: (txId as any) || undefined})
  const addr = (user as any)?.addr || (lastResponse?.data && (lastResponse.data as any).addr) || undefined
  

  const connectAuthn = useCallback(async () => {
    try {
      const base = `${window.location.origin}/authn`
      const accountApi = (import.meta as any).env?.VITE_PASSKEY_ACCOUNT_API
      const svc: any = {
        f_type: "Service",
        f_vsn: "1.0.0",
        type: "authn",
        method: "POP/RPC",
        uid: "passkey-wallet#authn",
        endpoint: base,
        provider: {address: "0x0", name: "Passkey Wallet", icon: `${window.location.origin}/vite.svg`},
        data: accountApi ? {accountApi} : undefined,
        params: {},
      }
      const maybeAuth: any = authenticate as any
      if (typeof maybeAuth === "function" && maybeAuth.length >= 1) {
        await maybeAuth({service: svc})
      } else if (client) {
        await (client as any).authenticate({service: svc})
      } else {
        await (authenticate as any)()
      }
    } catch {}
  }, [authenticate, client])

  return (
    <div style={{padding: 12}}>
      <h2 style={{marginTop: 0}}>Host Demo</h2>
      <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
        <button onClick={connectAuthn} style={{padding: "8px 12px"}}>Connect (Authn)</button>
        <button
          onClick={() =>
            mutate({
              cadence: "transaction { execute { log(\"hello\") } }",
              args: [],
              limit: 100,
            } as any)
          }
          disabled={isPending}
          style={{padding: "8px 12px"}}
        >
          {isPending ? "Authorizing..." : "Authorize (Authz)"}
        </button>
        {addr && (
          <button
            onClick={() => {
              try { unauthenticate() } catch {}
              setLastResponse(undefined)
            }}
            style={{padding: "8px 12px"}}
          >
            Logout
          </button>
        )}
      </div>
      {addr && (
        <div style={{marginTop: 10}}>
          <strong>Address:</strong> {addr}
        </div>
      )}
      {txId && (
        <div style={{marginTop: 10, fontSize: 12}}>
          <div><strong>TxID:</strong> {String(txId)}</div>
          {transactionStatus && (
            <div>Flow Status: {transactionStatus.statusString}</div>
          )}
        </div>
      )}
      {error && (
        <div style={{marginTop: 10, color: "#b00020", fontSize: 12}}>
          {error.message}
        </div>
      )}
      <p style={{color: "#666", fontSize: 12}}>Endpoints: /authn and /authz (wallet popups). This page uses React SDK hooks for demo.</p>
    </div>
  )
}

export default function HostHome() {
  return (
    <FlowProvider config={{accessNodeUrl: "https://rest-testnet.onflow.org", flowNetwork: "testnet"}}>
      <HostContent />
    </FlowProvider>
  )
}


