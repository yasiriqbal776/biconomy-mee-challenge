// env.ts
import dotenv from 'dotenv';
dotenv.config();

export const env = {
    mainnetRpcUrl: process.env.MAINNET_RPC_URL, // needed only for forking
    localRpcUrl: process.env.LOCAL_RPC_URL ?? 'http://127.0.0.1:8545',
    meeNodeUrl: process.env.MEE_NODE_URL ?? 'http://localhost:3000/v3',
    privateKey: process.env.PRIVATE_KEY as `0x${string}`,
    usdcWhale: process.env.USDC_WHALE as `0x${string}` | undefined,
    usdcTopUpAmount: '1000000',
    aaveSupplyAmountUsdc: process.env.AAVE_SUPPLY_AMOUNT_USDC ?? '100',
};

if (!env.privateKey) throw new Error('Missing PRIVATE_KEY in .env');

// constants.ts
export const network = {
    chainId: 1,
    ethPlaceholder: '0x0000000000000000000000000000000000000000' as const,
};

export const contracts = {
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const,
    aaveV3Pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' as const,
    aUsdc: '0x98c23e9d8f34fefb1b7bd6a91b7ff122f4e16f5c' as const,
};