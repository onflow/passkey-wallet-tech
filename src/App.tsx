import {useEffect, useMemo, useState} from "react"
import "./App.css"
import {ready, approve, decline} from "./wallet/messaging"
import type {AuthnResponse, Service, Signable} from "./wallet/types"
import {encodeMessageFromSignable, hexToBytes} from "./wallet/encode"
import {
  createCredential,
  loadCredential,
  getAssertion,
  bytesToHex,
  derToP256Raw,
  sha256,
} from "./wallet/webauthn"
import {encode as rlpEncode} from "@onflow/rlp"
import {createAccountWithPublicKey} from "./wallet/provision"
import {setAccountApiFromReadyPayload} from "./wallet/provision"
import {pathToView, viewToPath} from "./routes"
import type {ViewMode, Account} from "./ui/types"
import {AuthnView} from "./pages/wallet/AuthnView"
import {AuthzView} from "./pages/wallet/AuthzView"
import HostHome from "./pages/HostHome"

const WALLET_NAME = "Passkey Wallet"
const WALLET_UID_PREFIX = "passkey-wallet"
const ICON_URL = new URL("/vite.svg", window.location.origin).toString()


function buildServices(addr: string): Service[] {
  const origin = window.location.origin
  return [
    {
      f_type: "Service",
      f_vsn: "1.0.0",
      type: "authn",
      method: "POP/RPC",
      uid: `${WALLET_UID_PREFIX}#authn`,
      endpoint: `${origin}/authn`,
      id: addr,
      identity: {f_type: "Identity", f_vsn: "1.0.0", address: addr, keyId: 0},
      provider: {
        f_type: "ServiceProvider",
        address: "0x0",
        name: WALLET_NAME,
        icon: ICON_URL,
      },
    },
    {
      f_type: "Service",
      f_vsn: "1.0.0",
      type: "authz",
      method: "POP/RPC",
      uid: `${WALLET_UID_PREFIX}#authz`,
      endpoint: `${origin}/authz`,
      id: addr,
      identity: {f_type: "Identity", f_vsn: "1.0.0", address: addr, keyId: 0},
    },
  ]
}

export default function App() {
  const [readyPayload, setReadyPayload] = useState<any>()
  const [address, setAddress] = useState<string>("0xUSER")
  const [credId, setCredId] = useState<string | undefined>()
  const [uiError, setUiError] = useState<string | undefined>()
  
  
  const [hostOrigin, setHostOrigin] = useState<string>("")
  const [viewMode, setViewMode] = useState<ViewMode>("home")
  const [signable, setSignable] = useState<Signable | undefined>()
  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [accounts, setAccounts] = useState<Array<Account>>([])
  const [isRegistering, setIsRegistering] = useState<boolean>(false)

  // no-op placeholder removed

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const {data} = ev
      if (!data || typeof data !== "object") return
      const type = (data as any).type
      if (type === "FCL:VIEW:READY:RESPONSE") {
        setHostOrigin(ev.origin)
        const body = (data as any).body || (data as any)
        setReadyPayload(body)
        // Determine view mode
        if (body?.voucher) {
          setViewMode("authz")
          setSignable(body as Signable)
        } else {
          setViewMode("authn")
          setSignable(undefined)
        }
        try {
          setAccountApiFromReadyPayload(data as any)
        } catch {}
      } else if (type === "FCL:VIEW:CLOSE") {
        window.close()
      }
    }
    window.addEventListener("message", onMsg)
    // Tell FCL we are ready to receive
    ready()
    const saved = loadCredential()
    if (saved) {
      setCredId(saved.credentialId)
      if (saved.address) setAddress(saved.address)
      
    }
    // initialize accounts list from storage and saved address
    try {
      const raw = localStorage.getItem("passkey-wallet:accounts")
      const list: Array<{address: string; credentialId?: string}> = raw
        ? JSON.parse(raw)
        : []
      const addrs = new Set<string>(list.map(x => x.address.toLowerCase()))
      if (saved?.address && !addrs.has(saved.address.toLowerCase())) {
        list.push({address: saved.address, credentialId: saved.credentialId})
      }
      const unique = Array.from(
        new Map(list.map(x => [x.address.toLowerCase(), x])).values()
      )
      localStorage.setItem("passkey-wallet:accounts", JSON.stringify(unique))
      setAccounts(unique)
    } catch {}
    
    try {
      const mq =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
      const init = !!mq?.matches
      setDarkMode(init)
      const onChange = (e: MediaQueryListEvent) => setDarkMode(!!e.matches)
      mq?.addEventListener?.("change", onChange)
      return () => {
        window.removeEventListener("message", onMsg)
        mq?.removeEventListener?.("change", onChange)
      }
    } catch {
      return () => window.removeEventListener("message", onMsg)
    }
  }, [])

  // Sync view with browser history (pathname routes)
  useEffect(() => {
    const onPop = () => {
      try {
        const target = pathToView(window.location.pathname)
        setViewMode((prev: ViewMode) => (prev === target ? prev : target))
      } catch {}
    }
    // Initialize from current path
    onPop()
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // Keep path updated when internal view changes; don't rewrite '/'
  useEffect(() => {
    try {
      const desired = viewToPath(viewMode)
      const current = window.location.pathname
      if (current === "/authn" || current === "/authz") return
      if (current !== desired) window.history.pushState({}, "", desired)
    } catch {}
  }, [viewMode])

  

  // Fetch balances for accounts list
  useEffect(() => {
    let aborted = false
    const fetchBalances = async () => {
      try {
        const results: Array<{
          address: string
          credentialId?: string
          balance?: string
        }> = []
        for (const acc of accounts) {
          try {
            const res = await fetch(
              `https://rest-testnet.onflow.org/v1/accounts/${acc.address.replace(/^0x/, "")}`
            )
            if (!res.ok) {
              results.push({
                address: acc.address,
                credentialId: acc.credentialId,
                balance: "0",
              })
              continue
            }
            const json = await res.json()
            const bal = json?.account?.balance
            results.push({
              address: acc.address,
              credentialId: acc.credentialId,
              balance:
                bal == null ? "0" : typeof bal === "string" ? bal : String(bal),
            })
          } catch {
            results.push({
              address: acc.address,
              credentialId: acc.credentialId,
              balance: "0",
            })
          }
        }
        if (!aborted) setAccounts(results)
      } catch {}
    }
    if (accounts.length > 0) fetchBalances()
    return () => {
      aborted = true
    }
  }, [accounts.length])

  // Ensure body has no margin and hide window scrollbars (use internal scroll areas)
  useEffect(() => {
    const prevMargin = document.body.style.margin
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.margin = "0"
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.body.style.margin = prevMargin
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }
  }, [])

  // Resize popup to fit content (min/max bounds)
  useEffect(() => {
    const measureAndResize = () => {
      try {
        if (!window.resizeTo) return
        const doc = document.documentElement
        const body = document.body
        const contentHeight = Math.max(
          doc.scrollHeight,
          body.scrollHeight,
          doc.offsetHeight,
          body.offsetHeight,
          doc.clientHeight
        )
        const rootEl = (document.getElementById("root") || body) as HTMLElement
        const rootWidth =
          Math.ceil(
            rootEl.scrollWidth || rootEl.getBoundingClientRect().width
          ) || 620
        const innerTargetWidth = Math.min(660, Math.max(560, rootWidth + 8))
        const chromeW = Math.max(
          0,
          (window.outerWidth || 0) - (window.innerWidth || 0)
        )
        const chromeH = Math.max(
          0,
          (window.outerHeight || 0) - (window.innerHeight || 0)
        )
        const outerW = Math.max(
          window.outerWidth || 0,
          Math.round(innerTargetWidth + chromeW)
        )
        const minH = 480
        const maxH = 900
        const innerTargetHeight = Math.min(maxH, Math.max(minH, contentHeight))
        const outerH = Math.max(
          window.outerHeight || 0,
          Math.round(innerTargetHeight + chromeH)
        )
        window.resizeTo(outerW, outerH)
      } catch {}
    }
    const id = window.requestAnimationFrame(measureAndResize)
    return () => window.cancelAnimationFrame(id)
  }, [viewMode, accounts.length, readyPayload, uiError, address, darkMode])

  const doRegister = async () => {
    try {
      setIsRegistering(true)
      const rec = await createCredential()
      setCredId(rec.credentialId)
      if (rec.publicKeySec1Hex) {
        const newAddr = await createAccountWithPublicKey(rec.publicKeySec1Hex, {
          signAlgo: 1, // ECDSA_P256
          hashAlgo: 1, // SHA2_256
          weight: 1000,
        })
        const updated = {...rec, address: newAddr}
        localStorage.setItem(
          "passkey-wallet:credential",
          JSON.stringify(updated)
        )
        setAddress(newAddr)
        // account switches to newly created address automatically
        try {
          const raw = localStorage.getItem("passkey-wallet:accounts")
          const list: Array<{address: string; credentialId?: string}> = raw
            ? JSON.parse(raw)
            : []
          if (
            !list.find(x => x.address.toLowerCase() === newAddr.toLowerCase())
          )
            list.push({address: newAddr, credentialId: rec.credentialId})
          localStorage.setItem("passkey-wallet:accounts", JSON.stringify(list))
          setAccounts(list)
        } catch {}
      }
    } catch (e: any) {
      decline(e?.message || "Passkey registration failed")
    } finally {
      setIsRegistering(false)
    }
  }

  const doAuthn = async () => {
    try {
      // If no stored address, try to provision via account API when we have a passkey pubkey
      let addr = address
      const saved = loadCredential()
      if (
        (!addr || addr === "0xUSER") &&
        saved?.publicKeySec1Hex &&
        !saved?.address
      ) {
        let newAddr: string
        try {
          newAddr = await createAccountWithPublicKey(saved.publicKeySec1Hex, {
            signAlgo: 1, // ECDSA_P256
            hashAlgo: 1, // SHA2_256
            weight: 1000,
          })
        } catch (e: any) {
          const msg = String(e?.message || e || "")
          if (msg.includes("Account API not configured")) {
            setUiError(
              "Account API not configured. Set VITE_PASSKEY_ACCOUNT_API or pass service.data.accountApi from the host."
            )
            return
          }
          throw e
        }
        addr = newAddr
        // persist address alongside credential
        const updated = {...saved, address: newAddr}
        localStorage.setItem(
          "passkey-wallet:credential",
          JSON.stringify(updated)
        )
        setAddress(newAddr)
      }
      const services = buildServices(addr)
      const resp: AuthnResponse = {
        f_type: "AuthnResponse",
        f_vsn: "1.0.0",
        addr,
        services,
      }
      approve(resp)
    } catch (e: any) {
      decline(e?.message || "Authn failed")
    }
  }

  const doAuthz = async () => {
    try {
      const signable: Signable | undefined =
        (readyPayload as any)?.body || (readyPayload as any)
      if (!signable) throw new Error("No signable payload provided")
      // Construct the correct message for this signer
      const msgHex = encodeMessageFromSignable(signable as any, address)
      /* const payloadMsgHex = encodeTransactionPayload(signable.voucher as any)
      const role = msgHex === payloadMsgHex ? "payload" : "envelope" */
      // FLIP 264: Use the signable message hash per account key's hashAlgo.
      // Key was provisioned with SHA2_256, so compute SHA-256(msgHex) as challenge.
      const challenge = await sha256(hexToBytes(msgHex))
      // WebAuthn assertion for passkey credential using hashed challenge
      // Prefer the credentialId stored for the selected address, fallback to global credId
      const acctCredId = accounts.find(
        (a: Account) => a.address.toLowerCase() === address.toLowerCase()
      )?.credentialId
      const {signature, clientDataJSON, authenticatorData} = await getAssertion(
        acctCredId || credId,
        challenge
      )
      
      // Flow expects raw P-256 r||s (64 bytes) in signature field; extension_data carries WebAuthn materials
      const sigHex = bytesToHex(derToP256Raw(signature))
      // Attach WebAuthn materials per FLIP-264:
      // extension_data = 0x01 || RLP([authenticatorData, clientDataJSON])
      const rlpEncoded = rlpEncode([authenticatorData, clientDataJSON]) as any
      const rlpBytes =
        rlpEncoded instanceof Uint8Array
          ? (rlpEncoded as Uint8Array)
          : new Uint8Array(rlpEncoded)
      const signatureExtension = new Uint8Array(1 + rlpBytes.length)
      signatureExtension[0] = 0x01
      signatureExtension.set(rlpBytes, 1)
      
      const composite = {
        f_type: "CompositeSignature",
        f_vsn: "1.0.0",
        addr: address,
        keyId: 0,
        signature: sigHex,
        extensionData: bytesToHex(signatureExtension),
      }
      
      approve(composite)
    } catch (e: any) {
      decline(e?.message || "Authz failed")
    }
  }

  const theme = useMemo(
    () => ({
      bg: darkMode ? "#0b0d12" : "#fff",
      text: darkMode ? "#e6e6e6" : "#111",
      subtext: darkMode ? "#9aa4b2" : "#555",
      border: darkMode ? "#263040" : "#ddd",
      panel: darkMode ? "#141922" : "#f8f9fa",
      divider: darkMode ? "#1f2937" : "#eee",
      badgeBg: darkMode ? "#1f2937" : "#f1f3f5",
      primary: darkMode ? "#7b93ff" : "#000",
      primaryText: darkMode ? "#0b0d12" : "#fff",
      danger: "#b00020",
    }),
    [darkMode]
  )

  // styles moved into views where needed

  // formatFlow moved to AuthnView

  // removed balance formatter (no multi-account balances)

  const appMeta = useMemo(() => {
    try {
      const payload = readyPayload ? {body: readyPayload} : undefined
      const body = readyPayload ?? undefined
      const params = (payload as any)?.params ?? (body as any)?.params
      const app =
        (payload as any)?.app ||
        (body as any)?.app ||
        (payload as any)?.config?.app ||
        (body as any)?.config?.app ||
        params?.app
      const url: string | undefined = app?.url || app?.href || params?.url
      const name: string | undefined = app?.name
      const icon: string | undefined = app?.icon
      const originUrl = url || hostOrigin || document.referrer || ""
      return {
        name: name || (originUrl ? new URL(originUrl).host : ""),
        icon,
        url: originUrl,
      }
    } catch {
      return {
        name: hostOrigin || "",
        icon: undefined as string | undefined,
        url: hostOrigin,
      }
    }
  }, [readyPayload, hostOrigin])

  const hasCredential = !!credId
  const hasAddress = !!address && address !== "0xUSER"
  const selectedAccount = useMemo(
    () =>
      accounts.find(
        (a: Account) => a.address?.toLowerCase() === (address || "").toLowerCase()
      ),
    [accounts, address]
  )
  const selectedCredId = selectedAccount?.credentialId || credId
  const maskedSelectedCred = selectedCredId
    ? `${selectedCredId.slice(0, 6)}...${selectedCredId.slice(-6)}`
    : "none"

  const renderAuthn = () => (
    <AuthnView
      theme={theme}
      darkMode={darkMode}
      viewMode={viewMode}
      appMeta={appMeta}
      accounts={accounts}
      address={address}
      isRegistering={isRegistering}
      hasCredential={hasCredential}
      maskedSelectedCred={maskedSelectedCred}
      uiError={uiError}
      onSelectAddress={setAddress}
      onRegister={doRegister}
      onDeny={() => decline("User declined")}
      onApprove={doAuthn}
    />
  )

  const renderAuthz = () => (
    <AuthzView
      theme={theme}
      darkMode={darkMode}
      viewMode={viewMode}
      appMeta={appMeta}
      signable={signable}
      address={address}
      hasAddress={hasAddress}
      onApprove={doAuthz}
      onDeny={() => decline("User declined")}
    />
  )

  if (window.location.pathname === "/") return <HostHome />
  return viewMode === "authn"
    ? renderAuthn()
    : viewMode === "authz"
      ? renderAuthz()
      : <HostHome />
}
