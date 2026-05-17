'use strict';

const { CONTRACTS_8472, ERC20_ABI } = require('./constants');
const { getEthersProvider, getEthersSigner } = require('./chain');

/**
 * MRTToken — ERC-20 interface for the MRT (MyRxWallet Reward Token).
 * MRT is the native gas + governance + validator compensation token on Chain 8472.
 *
 * Regulatory note: MRT rewards are infrastructure compensation for active validator
 * work — not investment yield. Howey Test Prongs 3 & 4 are not satisfied.
 * See: https://myrxwallet.io/compliance.html#staking-validators
 */
class MRTToken {
  constructor(rpcUrl) {
    this._provider = getEthersProvider(rpcUrl);
  }

  _contract(signerOrProvider) {
    const { Contract } = require('ethers');
    return new Contract(CONTRACTS_8472.wrappedMRT, ERC20_ABI, signerOrProvider || this._provider);
  }

  /** Get MRT balance for an address (returns formatted string, e.g. "100.0"). */
  async balanceOf(address) {
    const { formatUnits } = require('ethers');
    const bal = await this._contract().balanceOf(address);
    return formatUnits(bal, 18);
  }

  /** Get total MRT supply in circulation. */
  async totalSupply() {
    const { formatUnits } = require('ethers');
    const sup = await this._contract().totalSupply();
    return formatUnits(sup, 18);
  }

  /**
   * Transfer MRT tokens.
   * @param {string} privateKey  Sender private key
   * @param {string} to          Recipient address
   * @param {string|number} amount  Amount in MRT (not wei)
   */
  async transfer(privateKey, to, amount) {
    const { parseUnits } = require('ethers');
    const signer = getEthersSigner(privateKey);
    const contract = this._contract(signer);
    const amountWei = parseUnits(String(amount), 18);
    const tx = await contract.transfer(to, amountWei);
    return tx.wait();
  }

  /**
   * Approve a spender (e.g. bridge contract) to spend MRT.
   * @param {string} privateKey
   * @param {string} spender
   * @param {string|number} amount
   */
  async approve(privateKey, spender, amount) {
    const { parseUnits } = require('ethers');
    const signer = getEthersSigner(privateKey);
    const contract = this._contract(signer);
    const amountWei = parseUnits(String(amount), 18);
    const tx = await contract.approve(spender, amountWei);
    return tx.wait();
  }

  /** Get allowance in formatted MRT. */
  async allowance(owner, spender) {
    const { formatUnits } = require('ethers');
    const val = await this._contract().allowance(owner, spender);
    return formatUnits(val, 18);
  }

  /** Get token metadata. */
  async metadata() {
    const c = this._contract();
    const [name, symbol, decimals, supply] = await Promise.all([
      c.name(), c.symbol(), c.decimals(), c.totalSupply(),
    ]);
    const { formatUnits } = require('ethers');
    return { name, symbol, decimals: Number(decimals), totalSupply: formatUnits(supply, 18) };
  }
}

module.exports = { MRTToken };
