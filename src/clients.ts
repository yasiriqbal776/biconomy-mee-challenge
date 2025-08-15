// clients.ts
import { createPublicClient, createWalletClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import {
    createMeeClient,
    getMEEVersion,
    MEEVersion,
    toMultichainNexusAccount,
    type Url,
} from '@biconomy/abstractjs'
import { env } from './config'

const chain = mainnet
const transport = http(env.localRpcUrl)
const meeVersion = getMEEVersion(MEEVersion.V2_1_0)

export const account = privateKeyToAccount(env.privateKey)

export const publicClient = createPublicClient({ chain, transport })
export const walletClient = createWalletClient({ account, chain, transport })

export async function getMeeAndOrchestrator() {
    const orchestrator = await toMultichainNexusAccount({
        chainConfigurations: [{ chain, transport, version: meeVersion }],
        signer: account,
    })

    const mee = await createMeeClient({
        account: orchestrator,
        url: env.meeNodeUrl as Url,
    })

    return { orchestrator, mee }
}
