'use strict';

// ── Chain 8472 — MyRx Chain ────────────────────────────────────────────────
const CHAIN_8472 = {
  chainId: 8472,
  name: 'MyRx Chain',
  symbol: 'MRT',
  decimals: 18,
  rpcUrl: 'https://rpc.myrxwallet.io',
  explorerUrl: 'https://explorer.myrxwallet.io',
  infoUrl: 'https://myrxwallet.io',
};

// ── Native token + Chain 8472 contracts ───────────────────────────────────
const CONTRACTS_8472 = {
  wrappedMRT:  '0x00e69754c21090d69D29a2abe3B6CF153D3F1dF7',
  wrappedBTC:  '0xC8604C8FcF96cEc581e8275A2CDf04e7F7348849',
  myRxUSD:     '0x8d86EA71F0621ffb47A5a40ab92409A022Dd30F7',
  nftRegistry: '0x8Bfb23155f35b0cC7Ee232dC3aBB925391f90da3',
};

// ── Bridge chains — MRTBridgeMint deployed ────────────────────────────────
const BRIDGE_CHAINS = {
  1:     { name: 'Ethereum Mainnet',  role: 'Institutional settlement' },
  8453:  { name: 'Base',              role: 'Primary bridge hub (Across Protocol)' },
  42161: { name: 'Arbitrum One',      role: 'L2 settlement layer' },
  137:   { name: 'Polygon',           role: 'High-throughput transactions' },
  56:    { name: 'BNB Smart Chain',   role: 'Global accessibility' },
};

// ── MyRxWallet API ─────────────────────────────────────────────────────────
const API_BASE = 'https://ehr.myrxwallet.io/api/v1';
const BRIDGE_API = 'https://wallet.myrxwallet.io';

// ── ERC-20 minimal ABI ────────────────────────────────────────────────────
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// ── MRTBridgeMint ABI ─────────────────────────────────────────────────────
const BRIDGE_ABI = [
  'function mint(address to, uint256 amount) external',
  'function burn(address from, uint256 amount) external',
  'function bridgeTo(uint256 targetChainId, address recipient, uint256 amount) external payable',
  'function getBridgeFee(uint256 targetChainId, uint256 amount) view returns (uint256)',
  'event BridgeInitiated(address indexed sender, uint256 indexed targetChainId, address recipient, uint256 amount)',
  'event BridgeCompleted(address indexed recipient, uint256 indexed sourceChainId, uint256 amount)',
];

module.exports = {
  CHAIN_8472,
  CONTRACTS_8472,
  BRIDGE_CHAINS,
  API_BASE,
  BRIDGE_API,
  ERC20_ABI,
  BRIDGE_ABI,
};
