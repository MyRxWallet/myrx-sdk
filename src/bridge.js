'use strict';

const { BRIDGE_CHAINS, BRIDGE_ABI, API_BASE } = require('./constants');
const { getEthersSigner } = require('./chain');

/**
 * MRTBridge — Multi-chain bridge for MRT tokens.
 * Deployed across 5 EVM networks: Base (primary), Arbitrum, Polygon, Ethereum, BSC.
 * Protocols: Across, Hop, Stargate, deBridge.
 */
class MRTBridge {
  /**
   * @param {string} bridgeContractAddress  MRTBridgeMint address on current chain
   * @param {string} rpcUrl                 RPC for current chain
   */
  constructor(bridgeContractAddress, rpcUrl) {
    this.bridgeContractAddress = bridgeContractAddress;
    this.rpcUrl = rpcUrl;
  }

  _contract(signer) {
    const { Contract } = require('ethers');
    return new Contract(this.bridgeContractAddress, BRIDGE_ABI, signer);
  }

  /**
   * Bridge MRT to another chain.
   * @param {string} privateKey
   * @param {number} targetChainId  Chain ID of destination (see BRIDGE_CHAINS)
   * @param {string} recipient      Destination address
   * @param {string|number} amount  MRT amount (not wei)
   */
  async bridgeTo(privateKey, targetChainId, recipient, amount) {
    if (!BRIDGE_CHAINS[targetChainId]) {
      throw new Error(`Unsupported target chain: ${targetChainId}. Supported: ${Object.keys(BRIDGE_CHAINS).join(', ')}`);
    }
    const { parseUnits } = require('ethers');
    const signer = getEthersSigner(privateKey, this.rpcUrl);
    const contract = this._contract(signer);
    const amountWei = parseUnits(String(amount), 18);
    const fee = await contract.getBridgeFee(targetChainId, amountWei);
    const tx = await contract.bridgeTo(targetChainId, recipient, amountWei, { value: fee });
    return { txHash: tx.hash, receipt: await tx.wait() };
  }

  /** Get bridge fee for a given amount to a target chain. Returns fee in native gas token. */
  async getBridgeFee(targetChainId, amount) {
    const { parseUnits, formatEther } = require('ethers');
    const { getEthersProvider } = require('./chain');
    const provider = getEthersProvider(this.rpcUrl);
    const { Contract } = require('ethers');
    const contract = new Contract(this.bridgeContractAddress, BRIDGE_ABI, provider);
    const amountWei = parseUnits(String(amount), 18);
    const fee = await contract.getBridgeFee(targetChainId, amountWei);
    return formatEther(fee);
  }

  /** List all supported bridge chains. */
  static supportedChains() {
    return Object.entries(BRIDGE_CHAINS).map(([id, info]) => ({
      chainId: Number(id),
      ...info,
    }));
  }
}

module.exports = { MRTBridge, BRIDGE_CHAINS };
