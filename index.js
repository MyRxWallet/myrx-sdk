// @myrx/sdk — MYRX-MAINNET Chain 8472 JavaScript SDK
// MIT License — MyRxWallet North America Corporation

const CHAIN_ID = 8472;
const DEFAULT_RPC = 'https://rpc.myrxwallet.io';

const ADDRESSES = {
  WMRT:    '0x00e69754c21090d69d29a2abe3b6cf153d3f1df7',
  WBTC:    '0xc8604c8fcf96cec581e8275a2cdf04e7f7348849',
  Router:  '0xe0eab9309910f7e0e60fc637af50b38a4b34ad2b',
  Factory: '0x7e4a7cc7d9e4e416e7277f8309cc54cf5fd8af2b',
  Bridge:  '0xc9be40494ef767a8760682d93de014e825bdb3e8',
};

const ABI = {
  ERC20:   ['function balanceOf(address) view returns (uint256)','function approve(address,uint256) returns (bool)','function transfer(address,uint256) returns (bool)','function totalSupply() view returns (uint256)','function decimals() view returns (uint8)'],
  Router:  ['function swapExactTokensForTokens(uint256,uint256,uint256[],address) returns (uint256[])','function addLiquidity(address,address,uint256,uint256,uint256,uint256,address) returns (uint256,uint256,uint256)','function factory() view returns (address)'],
  Factory: ['function getPair(address,address) view returns (address)','function allPairsLength() view returns (uint256)'],
  Pair:    ['function getReserves() view returns (uint112,uint112,uint32)','function token0() view returns (address)','function token1() view returns (address)'],
  Bridge:  ['function dailyMintCap() view returns (uint256)','function minRedemption() view returns (uint256)','function custodyBtcAddr() view returns (string)','function initiateRedemption(uint256,string)'],
};

class MyrxSDK {
  constructor({ rpc } = {}) {
    if (typeof rpc === 'string' && !rpc.startsWith('https://'))
      throw new Error('MyrxSDK: HTTPS RPC required in production');
    this._rpcUrl = rpc || DEFAULT_RPC;
    this._signer = null;
  }

  async _rpc(method, params = []) {
    const res = await fetch(this._rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  }

  async connect(provider) {
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== CHAIN_ID)
      throw new Error(`MyrxSDK: wrong chain — expected ${CHAIN_ID}, got ${net.chainId}`);
    this._signer = await provider.getSigner();
    return this._signer;
  }

  async getBlockNumber() { return parseInt(await this._rpc('eth_blockNumber'), 16); }

  async getBalance(address) {
    const raw = await this._rpc('eth_getBalance', [address, 'latest']);
    return Number(BigInt(raw) * 1000n / BigInt(1e15)) / 1000;
  }

  async getWBTCBalance(address) {
    const data = '0x70a08231' + address.slice(2).padStart(64, '0');
    return parseInt(await this._rpc('eth_call', [{ to: ADDRESSES.WBTC, data }, 'latest']), 16);
  }

  async getPrice(fromSymbol, toSymbol) {
    const [a, b] = [ADDRESSES[fromSymbol], ADDRESSES[toSymbol]];
    if (!a || !b) throw new Error('Unknown token');
    const pairRaw = await this._rpc('eth_call', [{
      to: ADDRESSES.Factory,
      data: '0xe6a43905' + a.slice(2).padStart(64,'0') + b.slice(2).padStart(64,'0')
    }, 'latest']);
    const pairAddr = '0x' + pairRaw.slice(26);
    if (pairAddr === '0x' + '0'.repeat(40)) return null;
    const raw = await this._rpc('eth_call', [{ to: pairAddr, data: '0x0902f1ac' }, 'latest']);
    const r0 = BigInt('0x' + raw.slice(2, 66));
    const r1 = BigInt('0x' + raw.slice(66, 130));
    return r1 > 0n ? Number(r0 * 10000n / r1) / 10000 : null;
  }

  async swap({ from, to, amount, slippage = 0.005 }) {
    if (!this._signer) throw new Error('Call connect() first');
    const { ethers } = await import('ethers');
    const router = new ethers.Contract(ADDRESSES.Router, ABI.Router, this._signer);
    await new ethers.Contract(ADDRESSES[from], ABI.ERC20, this._signer).approve(ADDRESSES.Router, amount);
    const minOut = BigInt(Math.floor(Number(amount) * (1 - slippage)));
    return router.swapExactTokensForTokens(amount, minOut, [ADDRESSES[from], ADDRESSES[to]], await this._signer.getAddress());
  }

  async addLiquidity({ tokenA, tokenB, amountA, amountB }) {
    if (!this._signer) throw new Error('Call connect() first');
    const { ethers } = await import('ethers');
    const router = new ethers.Contract(ADDRESSES.Router, ABI.Router, this._signer);
    await new ethers.Contract(ADDRESSES[tokenA], ABI.ERC20, this._signer).approve(ADDRESSES.Router, amountA);
    await new ethers.Contract(ADDRESSES[tokenB], ABI.ERC20, this._signer).approve(ADDRESSES.Router, amountB);
    return router.addLiquidity(ADDRESSES[tokenA], ADDRESSES[tokenB], amountA, amountB, 0, 0, await this._signer.getAddress());
  }

  async getBridgeInfo() {
    const { ethers } = await import('ethers');
    const bridge = new ethers.Contract(ADDRESSES.Bridge, ABI.Bridge, new ethers.JsonRpcProvider(this._rpcUrl));
    const [cap, min, custody] = await Promise.all([bridge.dailyMintCap(), bridge.minRedemption(), bridge.custodyBtcAddr()]);
    return { dailyMintCap: cap.toString(), minRedemption: min.toString(), custodyBtcAddr: custody };
  }
}

if (typeof module !== 'undefined') module.exports = { MyrxSDK, ADDRESSES, CHAIN_ID };
if (typeof window !== 'undefined') window.MyrxSDK = MyrxSDK;
