'use strict';

const { CHAIN_8472, CONTRACTS_8472, ERC20_ABI } = require('./constants');

/**
 * Chain8472Provider — lightweight wrapper around JSON-RPC for Chain 8472.
 * Uses ethers.js v6 if available; falls back to raw fetch for environments
 * where ethers is not bundled.
 */
class Chain8472Provider {
  constructor(rpcUrl = CHAIN_8472.rpcUrl) {
    this.rpcUrl = rpcUrl;
    this.chainId = CHAIN_8472.chainId;
    this._id = 0;
  }

  async _rpc(method, params = []) {
    const res = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++this._id, method, params }),
    });
    if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
    const { result, error } = await res.json();
    if (error) throw new Error(error.message || JSON.stringify(error));
    return result;
  }

  /** Get native MRT balance for an address (returns BigInt in wei). */
  async getBalance(address) {
    const hex = await this._rpc('eth_getBalance', [address, 'latest']);
    return BigInt(hex);
  }

  /** Get MRT balance formatted in ether units. */
  async getBalanceMRT(address) {
    const wei = await this.getBalance(address);
    return Number(wei) / 1e18;
  }

  /** Get current block number. */
  async getBlockNumber() {
    const hex = await this._rpc('eth_blockNumber');
    return parseInt(hex, 16);
  }

  /** Get gas price in wei. */
  async getGasPrice() {
    const hex = await this._rpc('eth_gasPrice');
    return BigInt(hex);
  }

  /** Get transaction count (nonce) for address. */
  async getTransactionCount(address) {
    const hex = await this._rpc('eth_getTransactionCount', [address, 'latest']);
    return parseInt(hex, 16);
  }

  /** Get transaction by hash. */
  async getTransaction(txHash) {
    return this._rpc('eth_getTransactionByHash', [txHash]);
  }

  /** Get transaction receipt. */
  async getTransactionReceipt(txHash) {
    return this._rpc('eth_getTransactionReceipt', [txHash]);
  }

  /** Send a signed raw transaction. Returns tx hash. */
  async sendRawTransaction(signedTx) {
    return this._rpc('eth_sendRawTransaction', [signedTx]);
  }

  /** Read a contract (eth_call). */
  async call(to, data) {
    return this._rpc('eth_call', [{ to, data }, 'latest']);
  }

  /** Get network info. */
  async getNetwork() {
    const chainIdHex = await this._rpc('eth_chainId');
    return { chainId: parseInt(chainIdHex, 16), name: CHAIN_8472.name };
  }

  /** Check that we're connected to Chain 8472. */
  async verify() {
    const { chainId } = await this.getNetwork();
    if (chainId !== this.chainId) {
      throw new Error(`Wrong chain: expected ${this.chainId}, got ${chainId}`);
    }
    return true;
  }
}

/**
 * Get an ethers.js Provider for Chain 8472 (requires ethers v6 installed).
 * @param {string} [rpcUrl]
 */
function getEthersProvider(rpcUrl = CHAIN_8472.rpcUrl) {
  try {
    const { JsonRpcProvider } = require('ethers');
    return new JsonRpcProvider(rpcUrl, {
      chainId: CHAIN_8472.chainId,
      name: CHAIN_8472.name,
    });
  } catch {
    throw new Error('ethers.js v6 not installed. Run: npm install ethers');
  }
}

/**
 * Get an ethers.js Signer connected to Chain 8472.
 * @param {string} privateKey
 * @param {string} [rpcUrl]
 */
function getEthersSigner(privateKey, rpcUrl = CHAIN_8472.rpcUrl) {
  const { Wallet } = require('ethers');
  const provider = getEthersProvider(rpcUrl);
  return new Wallet(privateKey, provider);
}

module.exports = { Chain8472Provider, getEthersProvider, getEthersSigner, CHAIN_8472, CONTRACTS_8472 };
