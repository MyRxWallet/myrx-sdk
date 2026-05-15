/**
 * @myrx/sdk — JavaScript SDK for MYRX-MAINNET (Chain 8472)
 * Wraps ethers.js v6 for wallet connect, swap, bridge, and balance queries.
 */

import { ethers } from 'ethers';

export const CHAIN_ID  = 8472;
export const RPC_URL   = 'https://rpc.myrxwallet.io';
export const CHAIN_HEX = '0x2118';

export const ADDRESSES = {
  WMRT:       '0x5A08434f87c8189F31b9FFDeA7CF64e5704691fc',
  WBTC:       '0x0602D45DF10436bA26Aa4FD0e8f5baA60b1BE0D1',
  DEX_ROUTER: '0x5Bde6072B6C4443BC993bb1cDD4f311383739c41',
  DEX_FACTORY:'0x83995Ac39CED53a93E77Ab5d194E43D47e076b34',
  BRIDGE:     '0x8f650C43A1e94c29Ed038C0F19458FbE42A68d05',
};

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
];

const ROUTER_ABI = [
  'function swapExactTokensForTokens(uint256 amtIn, uint256 amtOutMin, address[] path, address to) returns (uint256[] amounts)',
  'function factory() view returns (address)',
];

const FACTORY_ABI = [
  'function getPair(address,address) view returns (address)',
  'function allPairsLength() view returns (uint256)',
];

const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
];

const BRIDGE_ABI = [
  'function initiateWithdrawal(uint256 amountSatoshis, string btcDestAddress)',
  'function paused() view returns (bool)',
  'function dailyCap() view returns (uint256)',
  'event Withdrawal(address indexed sender, uint256 amount, string btcDestAddress)',
];

export class MyrxSDK {
  constructor({ rpc = RPC_URL } = {}) {
    this.rpc = rpc;
    this.provider = new ethers.JsonRpcProvider(rpc);
    this.signer = null;
    this.address = null;
  }

  /**
   * Connect MetaMask. Auto-adds Chain 8472 if not already in wallet.
   * @returns {string} connected wallet address
   */
  async connect() {
    if (!window?.ethereum) throw new Error('MetaMask not detected');
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const network = await browserProvider.getNetwork();
    if (Number(network.chainId) !== CHAIN_ID) {
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_HEX }] });
      } catch (e) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: CHAIN_HEX,
              chainName: 'MyrxWallet Network',
              nativeCurrency: { name: 'MRT', symbol: 'MRT', decimals: 18 },
              rpcUrls: [RPC_URL],
              blockExplorerUrls: ['https://explorer.myrxwallet.io'],
            }],
          });
        } else throw e;
      }
    }
    const signerProvider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await signerProvider.getSigner();
    this.address = await this.signer.getAddress();
    return this.address;
  }

  /**
   * Get native MRT balance for an address.
   * @param {string} address
   * @returns {string} balance in MRT (formatted)
   */
  async getBalance(address) {
    const bal = await this.provider.getBalance(address || this.address);
    return ethers.formatEther(bal);
  }

  /**
   * Get ERC-20 token balance.
   * @param {string} tokenAddress — use ADDRESSES.WMRT or ADDRESSES.WBTC
   * @param {string} [holder]
   * @returns {string} formatted balance
   */
  async getTokenBalance(tokenAddress, holder) {
    const addr = holder || this.address;
    if (!addr) throw new Error('No address — connect wallet first');
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const [bal, dec] = await Promise.all([token.balanceOf(addr), token.decimals()]);
    return ethers.formatUnits(bal, dec);
  }

  /**
   * Get current DEX price for a token pair.
   * @param {'WMRT'|'WBTC'} from
   * @param {'WMRT'|'WBTC'} to
   * @returns {{ rate: string, reserve0: string, reserve1: string }}
   */
  async getPrice(from, to) {
    const pair = await this._getPair(ADDRESSES[from], ADDRESSES[to]);
    if (pair === ethers.ZeroAddress) throw new Error('No liquidity pair');
    const pairContract = new ethers.Contract(pair, PAIR_ABI, this.provider);
    const [res, t0] = await Promise.all([pairContract.getReserves(), pairContract.token0()]);
    const isFromT0 = t0.toLowerCase() === ADDRESSES[from].toLowerCase();
    const [r0, r1] = isFromT0 ? [res[0], res[1]] : [res[1], res[0]];
    const dec0 = from === 'WMRT' ? 18 : 8;
    const dec1 = to   === 'WMRT' ? 18 : 8;
    const rate = (Number(ethers.formatUnits(r1, dec1)) / Number(ethers.formatUnits(r0, dec0))).toFixed(8);
    return {
      rate,
      [`reserve_${from.toLowerCase()}`]: ethers.formatUnits(r0, dec0),
      [`reserve_${to.toLowerCase()}`]:   ethers.formatUnits(r1, dec1),
    };
  }

  /**
   * Swap tokens via MyrxSwap DEX.
   * @param {{ from: 'WMRT'|'WBTC', to: 'WMRT'|'WBTC', amount: string, slippagePct?: number }} opts
   * @returns {ethers.TransactionReceipt}
   */
  async swap({ from, to, amount, slippagePct = 0.5 }) {
    if (!this.signer) throw new Error('Not connected — call connect() first');
    const tokenIn  = ADDRESSES[from];
    const tokenOut = ADDRESSES[to];
    const decIn    = from === 'WMRT' ? 18 : 8;
    const decOut   = to   === 'WMRT' ? 18 : 8;
    const amtIn    = ethers.parseUnits(amount, decIn);

    const price    = await this.getPrice(from, to);
    const estOut   = parseFloat(amount) * parseFloat(price.rate);
    const minOut   = ethers.parseUnits((estOut * (1 - slippagePct / 100)).toFixed(decOut), decOut);

    const token  = new ethers.Contract(tokenIn, ERC20_ABI, this.signer);
    const router = new ethers.Contract(ADDRESSES.DEX_ROUTER, ROUTER_ABI, this.signer);

    const allowance = await token.allowance(this.address, ADDRESSES.DEX_ROUTER);
    if (allowance < amtIn) {
      const approveTx = await token.approve(ADDRESSES.DEX_ROUTER, amtIn);
      await approveTx.wait();
    }

    const tx = await router.swapExactTokensForTokens(amtIn, minOut, [tokenIn, tokenOut], this.address);
    return tx.wait();
  }

  /**
   * Initiate a BTC withdrawal (peg-out). Burns WBTC on-chain; relayer releases BTC.
   * @param {{ satoshis: number, btcAddress: string }} opts
   * @returns {ethers.TransactionReceipt}
   */
  async withdrawBTC({ satoshis, btcAddress }) {
    if (!this.signer) throw new Error('Not connected — call connect() first');
    const bridge = new ethers.Contract(ADDRESSES.BRIDGE, BRIDGE_ABI, this.signer);
    const wbtc   = new ethers.Contract(ADDRESSES.WBTC, ERC20_ABI, this.signer);

    const allowance = await wbtc.allowance(this.address, ADDRESSES.BRIDGE);
    if (allowance < BigInt(satoshis)) {
      const approveTx = await wbtc.approve(ADDRESSES.BRIDGE, BigInt(satoshis));
      await approveTx.wait();
    }

    const tx = await bridge.initiateWithdrawal(BigInt(satoshis), btcAddress);
    return tx.wait();
  }

  /**
   * Get current chain block number.
   */
  async getBlockNumber() {
    return this.provider.getBlockNumber();
  }

  async _getPair(tokenA, tokenB) {
    const factory = new ethers.Contract(ADDRESSES.DEX_FACTORY, FACTORY_ABI, this.provider);
    return factory.getPair(tokenA, tokenB);
  }
}

export default MyrxSDK;
