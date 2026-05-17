/**
 * @myrxwallet/sdk — Quickstart Examples
 *
 * Run:  node examples/quickstart.js
 */

const {
  Chain8472Provider,
  MRTToken,
  MRTBridge,
  MyRxHealthClient,
  CHAIN_8472,
  CONTRACTS_8472,
  BRIDGE_CHAINS,
} = require('../src/index');

async function main() {
  console.log('\n=== @myrxwallet/sdk Quickstart ===\n');

  // ── 1. Connect to Chain 8472 ──────────────────────────────────────────────
  console.log('1. Connecting to Chain 8472...');
  const provider = new Chain8472Provider();
  const network = await provider.getNetwork();
  console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`   RPC: ${CHAIN_8472.rpcUrl}`);

  const blockNumber = await provider.getBlockNumber();
  console.log(`   Latest block: ${blockNumber}`);
  console.log(`   Explorer: ${CHAIN_8472.explorerUrl}\n`);

  // ── 2. Check MRT balance ──────────────────────────────────────────────────
  console.log('2. MRT Token (Wrapped MRT on Chain 8472)...');
  try {
    const mrt = new MRTToken();
    const meta = await mrt.metadata();
    console.log(`   Name: ${meta.name}`);
    console.log(`   Symbol: ${meta.symbol}`);
    console.log(`   Total Supply: ${meta.totalSupply} MRT\n`);
  } catch (e) {
    console.log(`   (requires ethers v6: npm install ethers) — ${e.message}\n`);
  }

  // ── 3. Bridge support ────────────────────────────────────────────────────
  console.log('3. Multi-chain Bridge — Supported Networks:');
  const chains = MRTBridge.supportedChains();
  chains.forEach(c => console.log(`   Chain ${c.chainId}: ${c.name} — ${c.role}`));
  console.log('');

  // ── 4. FHIR Capability Statement ─────────────────────────────────────────
  console.log('4. FHIR R4 Capability Statement...');
  try {
    const cap = await MyRxHealthClient.getCapabilityStatement();
    console.log(`   FHIR Version: ${cap.fhirVersion}`);
    console.log(`   Software: ${cap.software?.name}`);
    console.log(`   Status: ${cap.status}\n`);
  } catch (e) {
    console.log(`   (FHIR metadata: ${e.message})\n`);
  }

  // ── 5. SMART Config ───────────────────────────────────────────────────────
  console.log('5. SMART on FHIR Configuration...');
  try {
    const smart = await MyRxHealthClient.getSmartConfig();
    console.log(`   Authorization: ${smart.authorization_endpoint}`);
    console.log(`   Token: ${smart.token_endpoint}`);
    console.log(`   PKCE required: ${smart.code_challenge_methods_supported?.includes('S256')}\n`);
  } catch (e) {
    console.log(`   (SMART config: ${e.message})\n`);
  }

  // ── 6. Contracts ──────────────────────────────────────────────────────────
  console.log('6. Chain 8472 Contract Addresses:');
  Object.entries(CONTRACTS_8472).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

  console.log('\n=== @myrxwallet/sdk ready ===');
  console.log('Install: npm install @myrxwallet/sdk');
  console.log('Docs: https://myrxwallet.io/developer.html');
}

main().catch(console.error);
