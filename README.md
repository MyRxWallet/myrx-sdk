# @myrx/sdk

JavaScript SDK for MYRX-MAINNET (Chain ID 8472).

## Install

```bash
npm install @myrx/sdk ethers
```

## Usage

```javascript
import { MyrxSDK } from '@myrx/sdk';

const sdk = new MyrxSDK({ rpc: 'https://rpc.myrxwallet.io' });

const block    = await sdk.getBlockNumber();
const bal      = await sdk.getBalance('0xYourAddress');      // MRT
const wbtc     = await sdk.getWBTCBalance('0xYourAddress');  // satoshis
const musd     = await sdk.getMUSDBalance('0xYourAddress');  // MUSD units (8 dec)
const btcPrice = await sdk.getPrice('WMRT', 'WBTC');         // WBTC per WMRT
const usdPrice = await sdk.getUSDPrice();                    // USD per WMRT

// Write (requires wallet)
await sdk.connect(window.ethereum);
await sdk.swap({ from: 'WMRT', to: 'WBTC', amount: '1000000000000000000', slippage: 0.01 });
await sdk.swap({ from: 'WMRT', to: 'MUSD', amount: '1000000000000000000', slippage: 0.01 });
await sdk.addLiquidity({ tokenA: 'WMRT', tokenB: 'MUSD', amountA: '1000000000000000000', amountB: '452000000000' });
const bridge = await sdk.getBridgeInfo();
```

## Contract Addresses

| Contract | Address |
|---|---|
| WMRT | 0x00e69754c21090d69d29a2abe3b6cf153d3f1df7 |
| WBTC | 0xc8604c8fcf96cec581e8275a2cdf04e7f7348849 |
| MUSD | 0xddca7ac61e820744799397944486156bb009a1c1 |
| Router | 0xe0eab9309910f7e0e60fc637af50b38a4b34ad2b |
| Factory | 0x7e4a7cc7d9e4e416e7277f8309cc54cf5fd8af2b |
| Bridge | 0xc9be40494ef767a8760682d93de014e825bdb3e8 |
| WMRT/WBTC Pair | 0x16bf6e74b9fee4306a7d268468fc4d45c2f4b0c3 |
| WMRT/MUSD Pair | 0xf1946991ea67cdbb8d74b3124003d55a2069bd2e |

## Chain Info

| Field | Value |
|---|---|
| Chain ID | 8472 |
| RPC | https://rpc.myrxwallet.io |
| WSS | wss://rpc.myrxwallet.io |
| Explorer | https://explorer.myrxwallet.io |
| Swap DEX | https://swap.myrxwallet.io |

## License
MIT — MyRxWallet North America Corporation 2026
