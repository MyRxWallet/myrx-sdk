// @myrxwallet/sdk — TypeScript Definitions
// Chain 8472 (MyRx Chain) — FHIR R4 — MRT Token — Multi-chain Bridge

export interface ChainConfig {
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  explorerUrl: string;
  infoUrl: string;
}

export interface Contracts8472 {
  wrappedMRT: string;
  wrappedBTC: string;
  myRxUSD: string;
  nftRegistry: string;
}

export interface BridgeChainInfo {
  chainId: number;
  name: string;
  role: string;
}

export interface BridgeResult {
  txHash: string;
  receipt: object;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface SmartAuthOptions {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scope?: string;
  state?: string;
}

export interface CodeExchangeOptions {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}

// ── Chain8472Provider ─────────────────────────────────────────────────────

export class Chain8472Provider {
  constructor(rpcUrl?: string);
  getBalance(address: string): Promise<bigint>;
  getBalanceMRT(address: string): Promise<number>;
  getBlockNumber(): Promise<number>;
  getGasPrice(): Promise<bigint>;
  getTransactionCount(address: string): Promise<number>;
  getTransaction(txHash: string): Promise<object>;
  getTransactionReceipt(txHash: string): Promise<object>;
  sendRawTransaction(signedTx: string): Promise<string>;
  call(to: string, data: string): Promise<string>;
  getNetwork(): Promise<{ chainId: number; name: string }>;
  verify(): Promise<boolean>;
}

export function getEthersProvider(rpcUrl?: string): object;
export function getEthersSigner(privateKey: string, rpcUrl?: string): object;

// ── MRTToken ──────────────────────────────────────────────────────────────

export class MRTToken {
  constructor(rpcUrl?: string);
  balanceOf(address: string): Promise<string>;
  totalSupply(): Promise<string>;
  transfer(privateKey: string, to: string, amount: string | number): Promise<object>;
  approve(privateKey: string, spender: string, amount: string | number): Promise<object>;
  allowance(owner: string, spender: string): Promise<string>;
  metadata(): Promise<TokenMetadata>;
}

// ── MRTBridge ─────────────────────────────────────────────────────────────

export class MRTBridge {
  constructor(bridgeContractAddress: string, rpcUrl: string);
  bridgeTo(privateKey: string, targetChainId: number, recipient: string, amount: string | number): Promise<BridgeResult>;
  getBridgeFee(targetChainId: number, amount: string | number): Promise<string>;
  static supportedChains(): BridgeChainInfo[];
}

// ── MyRxHealthClient ──────────────────────────────────────────────────────

export class MyRxHealthClient {
  constructor(bearerToken: string, baseUrl?: string);
  getPatient(patientId: string): Promise<object>;
  getMedications(patientId: string): Promise<object>;
  getConditions(patientId: string): Promise<object>;
  getObservations(patientId: string, category?: string): Promise<object>;
  getAppointments(patientId: string): Promise<object>;
  bookAppointment(body: object): Promise<object>;
  getNFTs(patientId: string): Promise<object>;
  getMRTBalance(patientId: string): Promise<object>;
  getMyRxScore(patientId: string): Promise<object>;
  getPrescriptionNFTs(patientId: string): Promise<object>;
  getLabNFTs(patientId: string): Promise<object>;
  getConsentAudit(patientId: string): Promise<object>;
  getHealthCard(patientId: string): Promise<object>;
  static getCapabilityStatement(baseUrl?: string): Promise<object>;
  static getSmartConfig(baseUrl?: string): Promise<object>;
  static buildAuthUrl(opts: SmartAuthOptions, baseUrl?: string): string;
  static exchangeCode(opts: CodeExchangeOptions, baseUrl?: string): Promise<object>;
}

// ── Constants ─────────────────────────────────────────────────────────────

export const CHAIN_8472: ChainConfig;
export const CONTRACTS_8472: Contracts8472;
export const API_BASE: string;
export const BRIDGE_API: string;
export const ERC20_ABI: string[];
export const BRIDGE_ABI: string[];
export const BRIDGE_CHAINS: Record<number, { name: string; role: string }>;
