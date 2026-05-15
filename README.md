# @myrx/sdk

JavaScript SDK for **MYRX-MAINNET** (Chain 8472) — connect wallets, swap tokens, bridge BTC, and query chain state.

## Install

```bash
npm install @myrx/sdk ethers
```

## Quick Start

```js
import { MyrxSDK } from '@myrx/sdk';

const sdk = new MyrxSDK();

// Connect MetaMask (auto-adds Chain 8472)
const address = await sdk.connect();

// Get MRT balance
const balance = await sdk.getBalance(address);
console.log('MRT:', balance);

// Get WMRT/WBTC exchange rate
const price = await sdk.getPrice('WMRT', 'WBTC');
console.log('1 WMRT =', price.rate, 'WBTC');

// Swap 1 WMRT → WBTC (0.5% slippage)
const receipt = await sdk.swap({ from: 'WMRT', to: 'WBTC', amount: '1.0' });
console.log('Swap tx:', receipt.hash);

// Withdraw 10,000 sat of WBTC → BTC (peg-out)
const payout = await sdk.withdrawBTC({ satoshis: 10000, btcAddress: 'bc1q...' });
```

## API

### `new MyrxSDK({ rpc? })`
Initialize SDK. Defaults to `https://rpc.myrxwallet.io`.

### `sdk.connect() → string`
Connect MetaMask. Returns wallet address. Auto-adds Chain 8472.

### `sdk.getBalance(address?) → string`
Native MRT balance (formatted).

### `sdk.getTokenBalance(tokenAddress, holder?) → string`
ERC-20 balance. Use `ADDRESSES.WMRT` or `ADDRESSES.WBTC`.

### `sdk.getPrice(from, to) → { rate, reserve_wmrt, reserve_wbtc }`
Current DEX spot price from pool reserves.

### `sdk.swap({ from, to, amount, slippagePct? }) → receipt`
Swap via MyrxSwap DEX. Handles approve + swap in one call.

### `sdk.withdrawBTC({ satoshis, btcAddress }) → receipt`
Burn WBTC on-chain. Relayer releases BTC to `btcAddress`.

### `sdk.getBlockNumber() → number`
Current block height.

## Contract Addresses (Chain 8472)

| Contract | Address |
|---|---|
| WMRT | `0x5A08434f87c8189F31b9FFDeA7CF64e5704691fc` |
| WBTC (canonical) | `0x0602D45DF10436bA26Aa4FD0e8f5baA60b1BE0D1` |
| MyrxSwap Router | `0x5Bde6072B6C4443BC993bb1cDD4f311383739c41` |
| MyrxSwap Factory | `0x83995Ac39CED53a93E77Ab5d194E43D47e076b34` |
| BTC Bridge | `0x8f650C43A1e94c29Ed038C0F19458FbE42A68d05` |

## License

MIT — MyRxWallet North America Corporation
