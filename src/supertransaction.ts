// supertransaction.ts
/**
 * Supertransaction demo:
 * 1) (Optional) Fund EOA with USDC by impersonating a whale on the Anvil fork.
 * 2) Build a Fusion supertransaction:
 *    - approve USDC → Aave v3 Pool
 *    - supply USDC on behalf of the Companion/Nexus
 *    - transfer resulting aUSDC from Companion → EOA
 * 3) Execute & wait for completion.
 */

import {
    erc20Abi,
    formatUnits,
    parseUnits,
    createTestClient,
    http,
    parseEther,
    type Address,
} from 'viem'
import { env, contracts, network } from './config'
import { publicClient, walletClient, account, getMeeAndOrchestrator } from './clients'
import { runtimeERC20BalanceOf } from '@biconomy/abstractjs'

// ---- constants & helpers ----------------------------------------------------
const USDC_DECIMALS = 6 as const
const toUSDC = (v: string) => parseUnits(v, USDC_DECIMALS)
const fromUSDC = (v: bigint) => formatUnits(v, USDC_DECIMALS)

const aavePoolAbi = [
    {
        name: 'supply',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'asset', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'onBehalfOf', type: 'address' },
            { name: 'referralCode', type: 'uint16' },
        ],
        outputs: [],
    },
] as const

// Anvil-only methods (impersonation, setBalance, etc.)
const testClient = createTestClient({ mode: 'anvil', transport: http(env.localRpcUrl) })

// ---- funding ---------------------------------------------------------------
/**
 * Impersonate a USDC whale and transfer `amountHuman` USDC to `to`.
 * Skips automatically if USDC_WHALE isn't set (useful for re-runs).
 */
async function fundWithUsdc(to: Address, amountHuman: string) {
    const whale = env.usdcWhale as Address | undefined
    if (!whale) {
        console.log('ℹ️  USDC_WHALE not set; skipping local funding step')
        return
    }

    const amount = toUSDC(amountHuman)

    await testClient.impersonateAccount({ address: whale })
    try {
        // Ensure whale has ETH for gas on the fork.
        await testClient.setBalance({ address: whale, value: parseEther('1000') })

        const txHash = await walletClient.writeContract({
            account: whale, // Anvil signs because we're impersonating
            address: contracts.usdc,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [to, amount],
        })

        console.log(`💸 Funded ${to} with ${amountHuman} USDC (tx: ${txHash}). Waiting For confirmation...`)
        await publicClient.waitForTransactionReceipt({ hash: txHash })
    } finally {
        await testClient.stopImpersonatingAccount({ address: whale })
    }
}

// ---- main flow -------------------------------------------------------------
export async function runFusionAave(): Promise<`0x${string}`> {
    // 0) Optional: top up EOA on the fork.
    await fundWithUsdc(account.address as Address, env.usdcTopUpAmount)

    // 1) Create Companion/Nexus and MEE client
    const { mee, orchestrator } = await getMeeAndOrchestrator()
    const companion = orchestrator.addressOn(network.chainId, true)

    const supplyAmount = toUSDC(env.aaveSupplyAmountUsdc)
    console.log('🧭 Companion (chain 1):', companion)
    console.log('📦 Supply amount (USDC):', fromUSDC(supplyAmount))

    // Pre-check: ensure EOA has enough USDC
    const eoaUsdcBefore = (await publicClient.readContract({
        abi: erc20Abi,
        address: contracts.usdc,
        functionName: 'balanceOf',
        args: [account.address],
    })) as bigint

    if (eoaUsdcBefore < supplyAmount) {
        throw new Error(
            `Insufficient USDC on EOA. Have ${fromUSDC(eoaUsdcBefore)}, need ${fromUSDC(supplyAmount)}`
        )
    }

    // 2) approve USDC → Aave Pool
    const approveUsdc = await orchestrator.buildComposable({
        type: 'default',
        data: {
            chainId: network.chainId,
            to: contracts.usdc,
            functionName: 'approve',
            args: [contracts.aaveV3Pool, supplyAmount],
            abi: erc20Abi,
        },
    })

    // 3) Aave Pool.supply(asset, amount, onBehalfOf, referralCode)
    const supplyUsdc = await orchestrator.buildComposable({
        type: 'default',
        data: {
            chainId: network.chainId,
            abi: aavePoolAbi,
            functionName: 'supply',
            to: contracts.aaveV3Pool,
            args: [contracts.usdc, supplyAmount, companion, 0],
        },
    })

    // 4) transfer resulting aUSDC from Companion → EOA
    const sendAUSDC = await orchestrator.buildComposable({
        type: 'default',
        data: {
            chainId: network.chainId,
            to: contracts.aUsdc,
            functionName: 'transfer',
            args: [
                account.address,
                runtimeERC20BalanceOf({
                    targetAddress: companion,
                    tokenAddress: contracts.aUsdc,
                    constraints: [],
                }),
            ],
            abi: erc20Abi,
        },
    })

    // 5) Quote & execute
    const instructions = [...approveUsdc, ...supplyUsdc, ...sendAUSDC]

    const fusionQuote = await mee.getFusionQuote({
        instructions,
        // Trigger pulls USDC from EOA into Companion; fees paid in USDC
        trigger: { chainId: network.chainId, tokenAddress: contracts.usdc, amount: supplyAmount },
        feeToken: { chainId: network.chainId, address: contracts.usdc },
    })

    console.log('⚙️  Executing Fusion quote…')
    const { hash } = await mee.executeFusionQuote({ fusionQuote })
    console.log('✅ Supertransaction:', hash)

    await mee.waitForSupertransactionReceipt({ hash })

    // 6) Post-state (balances)
    const companionAUsdc = (await publicClient.readContract({
        abi: erc20Abi,
        address: contracts.aUsdc,
        functionName: 'balanceOf',
        args: [companion],
    })) as bigint
    console.log('📈 aUSDC balance on Companion:', formatUnits(companionAUsdc, USDC_DECIMALS))

    const eoaAUsdc = (await publicClient.readContract({
        abi: erc20Abi,
        address: contracts.aUsdc,
        functionName: 'balanceOf',
        args: [account.address],
    })) as bigint
    console.log('📈 aUSDC balance on EOA:', formatUnits(eoaAUsdc, USDC_DECIMALS))

    return hash
}
