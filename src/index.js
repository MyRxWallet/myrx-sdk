'use strict';

/**
 * @myrxwallet/sdk — Official SDK for MyRxWallet North America Corporation
 *
 * Chain 8472 (MyRx Chain) — EVM-compatible blockchain for federally-mandated
 * patient health data infrastructure pursuant to the 21st Century Cures Act.
 *
 * @see https://myrxwallet.io
 * @see https://ehr.myrxwallet.io/api/v1/fhir/r4/metadata
 */

const { Chain8472Provider, getEthersProvider, getEthersSigner } = require('./chain');
const { MRTToken } = require('./token');
const { MRTBridge, BRIDGE_CHAINS } = require('./bridge');
const { MyRxHealthClient } = require('./health');
const constants = require('./constants');

const {
  CHAIN_8472,
  CONTRACTS_8472,
  API_BASE,
  BRIDGE_API,
  ERC20_ABI,
  BRIDGE_ABI,
} = constants;

module.exports = {
  // ── Chain 8472 ────────────────────────────────────────────────────────────
  Chain8472Provider,
  getEthersProvider,
  getEthersSigner,

  // ── MRT Token ─────────────────────────────────────────────────────────────
  MRTToken,

  // ── Bridge ────────────────────────────────────────────────────────────────
  MRTBridge,
  BRIDGE_CHAINS,

  // ── Healthcare API ────────────────────────────────────────────────────────
  MyRxHealthClient,

  // ── Constants ─────────────────────────────────────────────────────────────
  CHAIN_8472,
  CONTRACTS_8472,
  API_BASE,
  BRIDGE_API,
  ERC20_ABI,
  BRIDGE_ABI,
};
