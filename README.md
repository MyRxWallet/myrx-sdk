# @myrxwallet/sdk

Official SDK for **Chain 8472 (MyRx Chain)** — the EVM-compatible blockchain securing patient health data under the 21st Century Cures Act.

[![npm version](https://img.shields.io/npm/v/@myrxwallet/sdk)](https://www.npmjs.com/package/@myrxwallet/sdk)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Chain 8472](https://img.shields.io/badge/Chain-8472-7c3aed)](https://explorer.myrxwallet.io)
[![FHIR R4](https://img.shields.io/badge/FHIR-R4-00d5d5)](https://ehr.myrxwallet.io/api/v1/fhir/r4/metadata)

## Installation

```bash
npm install @myrxwallet/sdk
# Optional: ERC-20 + bridge operations require ethers v6
npm install ethers
```

## Chain 8472 Quick Connect

```javascript
const { Chain8472Provider, CHAIN_8472 } = require('@myrxwallet/sdk');

const provider = new Chain8472Provider();
const block = await provider.getBlockNumber();
const balanceMRT = await provider.getBalanceMRT('0xYourAddress');

console.log(`Chain ${CHAIN_8472.chainId} — block ${block}`);
console.log(`MRT balance: ${balanceMRT}`);
```

**RPC:** `https://rpc.myrxwallet.io`  
**Chain ID:** `8472`  
**Explorer:** `https://explorer.myrxwallet.io`  
**Native Token:** MRT (MyRxWallet Reward Token, 18 decimals)

Add to MetaMask / any EVM wallet:

```json
{
  "chainId": "0x2118",
  "chainName": "MyRx Chain",
  "rpcUrls": ["https://rpc.myrxwallet.io"],
  "nativeCurrency": { "name": "MyRx Token", "symbol": "MRT", "decimals": 18 },
  "blockExplorerUrls": ["https://explorer.myrxwallet.io"]
}
```

## MRT Token

```javascript
const { MRTToken, CONTRACTS_8472 } = require('@myrxwallet/sdk');

const mrt = new MRTToken();

// Get token metadata
const meta = await mrt.metadata();
// { name: 'Wrapped MRT', symbol: 'wMRT', decimals: 18, totalSupply: '...' }

// Check balance
const balance = await mrt.balanceOf('0xYourAddress');

// Transfer MRT
const receipt = await mrt.transfer(privateKey, recipientAddress, '10.0');

// Approve bridge
await mrt.approve(privateKey, BRIDGE_CONTRACT_ADDRESS, '100.0');
```

**Wrapped MRT:** `0x00e69754c21090d69D29a2abe3B6CF153D3F1dF7`  
**Regulatory note:** MRT rewards are infrastructure compensation — not investment yield. [Full regulatory analysis →](https://myrxwallet.io/compliance.html#staking-validators)

## Multi-chain Bridge

MRT is live across 5 EVM networks via MRTBridgeMint contracts.

```javascript
const { MRTBridge } = require('@myrxwallet/sdk');

// List supported chains
const chains = MRTBridge.supportedChains();
// [{ chainId: 8453, name: 'Base', role: 'Primary bridge hub' }, ...]

// Bridge MRT from Base → Chain 8472
const bridge = new MRTBridge(BRIDGE_CONTRACT_ON_BASE, BASE_RPC_URL);
const fee = await bridge.getBridgeFee(8472, '100');
const result = await bridge.bridgeTo(privateKey, 8472, recipientAddress, '100');
```

| Chain | Role |
|-------|------|
| Base (8453) | Primary bridge hub — Across Protocol |
| Arbitrum (42161) | L2 settlement layer |
| Polygon (137) | High-throughput transactions |
| Ethereum (1) | Institutional settlement |
| BNB Chain (56) | Global accessibility |

## Healthcare API (FHIR R4)

```javascript
const { MyRxHealthClient } = require('@myrxwallet/sdk');

// Authenticate via SMART on FHIR (PKCE)
const authUrl = MyRxHealthClient.buildAuthUrl({
  clientId: 'your-client-id',
  redirectUri: 'https://your-app.com/callback',
  codeChallenge: codeChallenge,
  scope: 'patient/*.read openid fhirUser',
});

// After redirect, exchange code for token
const token = await MyRxHealthClient.exchangeCode({
  code: authorizationCode,
  clientId: 'your-client-id',
  redirectUri: 'https://your-app.com/callback',
  codeVerifier: codeVerifier,
});

// Access patient data
const client = new MyRxHealthClient(token.access_token);
const patient   = await client.getPatient(patientId);
const meds      = await client.getMedications(patientId);
const vitals    = await client.getObservations(patientId, 'vital-signs');
const nfts      = await client.getNFTs(patientId);
const score     = await client.getMyRxScore(patientId);
```

**FHIR Endpoint:** `https://ehr.myrxwallet.io/api/v1/fhir/r4/metadata`  
**Standards:** HL7 FHIR R4 · US Core 6.1.0 · SMART App Launch 2.0.0 · Bulk Data 2.0.0  
**Inferno Result:** 317/317 PASS (ONC (g)(10) certification baseline)

## Validators

Chain 8472 validator network secures federally-mandated patient health infrastructure.

- **Phase 1 (2026):** 10–50 validators — founding team + DAO members + credentialed developers
- **NFT-gated credentialing:** Validator rights tied to NFT tier (Founding/Provider/Community/Developer)
- **DAO governance:** DAORX.IO — protocol parameters, emission schedules, validator standards

```javascript
// Get validator network status via raw RPC
const provider = new Chain8472Provider();
await provider.verify(); // confirms you're on Chain 8472

// Full regulatory framework:
// https://myrxwallet.io/docs/staking-validators-whitepaper.html
```

## Developer Portal

Register for API keys and sandbox access:

- **Developer Portal:** https://myrxwallet.io/developer.html
- **Sandbox:** Instant keys prefixed `mrx_sb_`
- **Production:** Manual review, prefixed `mrx_lv_`
- **SMART App Registration:** `POST /api/v1/developer/register`

## Compliance

| Standard | Status |
|----------|--------|
| FHIR R4 / US Core 6.1.0 | ✅ Inferno 317/317 PASS |
| SMART on FHIR 2.0.0 + PKCE | ✅ Live |
| HIPAA Security Rule (45 CFR §164.312) | ✅ AES-256-GCM |
| 21st Century Cures Act / ONC Interoperability Rule | ✅ Core requirement |
| DEA EPCS (21 CFR Part 1311) | ✅ TOTP 2FA + audit log |
| SEC Howey Test (MRT) | ✅ Prongs 3 & 4 not satisfied |

## License

Apache 2.0 — MyRxWallet North America Corporation  
CAGE: 9VNZ7 · UEI: RKYFJECN9GL3

[myrxwallet.io](https://myrxwallet.io) · [compliance](https://myrxwallet.io/compliance.html) · [developer docs](https://myrxwallet.io/developer.html)
