## Passkey Wallet Demo

This is a demo implementation of a passkey (WebAuthn) wallet for Flow that shows basic creation and signing. It uses the [FCL Wallet Provider Spec](https://developers.flow.com/build/tools/wallet-provider-spec) for the interaction model. Demo only; not production software.

### What it demonstrates
- WebAuthn passkey creation and mapping to a Flow account key (P‑256/SHA2‑256)
- Transaction authorization via passkey and FLIP‑264 signature extension data
- FCL View protocol messaging (READY / READY:RESPONSE / RESPONSE)
- Endpoints:
  - `/` host demo (connect + send tx using Flow React SDK hooks)
  - `/authn` wallet connect popup (AuthnResponse)
  - `/authz` wallet sign popup (CompositeSignature)

### Quick start
```bash
npm install
npm run dev   # http://localhost:8710
```

On `/` click:
- Connect (Authn): opens `/authn` and returns the address
- Authorize (Authz): sends a minimal transaction; shows tx id + status

### How it’s wired (short)
- Host page uses Flow React SDK hooks (`useFlowCurrentUser`, `useFlowMutate`, `useFlowTransactionStatus`). See docs: https://developers.flow.com/build/tools/react-sdk/hooks
- Wallet popups implement the FCL View contract and use WebAuthn for signatures; signatures are formatted for Flow and include FLIP‑264 extension data.

### Notes
- Demo only. No custody, recovery, or production UX decisions are implied.
- RP ID is `window.location.hostname`.
- Network: testnet (configurable in code).

### References
- Flow React SDK hooks: https://developers.flow.com/build/tools/react-sdk/hooks
- FLIP‑264 (WebAuthn Credential Support): https://github.com/onflow/flips/blob/cfaaf5f6b7c752e8db770e61ec9c180dc0eb6543/protocol/20250203-webauthn-credential-support.md
