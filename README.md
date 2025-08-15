# Biconomy MEE + Aave Supertransaction Demo

> **Assignment Reference:** [Assignment Link](https://biconomy.notion.site/Typescript-Engineer-MEE-Task-1de75fdf326480028101d85caead3d49)

This project demonstrates executing a **Fusion supertransaction** on a local Biconomy **Modular Execution Environment (MEE)** node, interacting with **Aave v3** on a **forked Ethereum mainnet**.

It fulfills the hiring assignment by:
- Forking mainnet locally with Anvil
- Running a local MEE node
- Funding an EOA with USDC via whale impersonation
- Supplying USDC to Aave on behalf of the Companion/Nexus
- Transferring resulting aUSDC back to the EOA

---

## 📋 Features

- Local stack: **Anvil + Redis + MEE Node** (Docker)
- Single **supertransaction** with one user signature
- **Gas in USDC**
- Configurable via `.env`

---

## 🛠 Prerequisites

You need to have the following installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Compose v2 included)
- [Node.js 18+](https://nodejs.org/en/download/)
- [pnpm](https://pnpm.io/installation) (JavaScript package manager)
- A **paid/private Ethereum mainnet RPC URL** (public/free RPCs often fail when forking)

---

## 🚀 Quick Start

#### 1) **Clone the repository**

```bash
git clone https://github.com/yasiriqbal776/biconomy-mee-challenge.git
cd biconomy-mee-challenge
```

#### 2) **Install dependencies**

```bash
pnpm install
```

#### 3) **Set up environment variables**

```bash
# Copy the example file and update values
cp .env.example .env
```
After copying, **open `.env` in your editor** and update the values according to your environment:

- **`MAINNET_RPC_URL`** → Your paid/private Ethereum mainnet RPC URL
- **`PRIVATE_KEY`** → Your test EOA private key (for signing transactions)
- **`USDC_WHALE`** → A USDC whale address on mainnet *(already included in `.env.example`, can be used as is)*
- **`AAVE_SUPPLY_AMOUNT_USDC`** → Amount of USDC to supply to Aave in the demo


#### 4) **Start the local stack**

**Note**: Make sure Docker Desktop is installed and running on your machine before running this command.
> **What it does:** Runs `docker compose` to start:
>
> - **Anvil** — forked Ethereum mainnet with USDC & Aave v3 contracts available
> - **Redis** — in-memory datastore used by the MEE node
> - **MEE Node** — local execution engine that orchestrates Fusion supertransactions

```bash
pnpm mee:up
```
#### 5) **Verify MEE node health**

Before running the demo, make sure the MEE node is healthy and ready.  
You can verify by opening this URL in your browser or using `curl`:

[http://localhost:3000/v3/info](http://localhost:3000/v3/info)

If the node is running correctly, you should see a JSON response with version and chain information.

#### 6) **Run the demo**

> **What it does:** Executes the full Fusion supertransaction demo:
>
> - Impersonates a USDC whale and funds your EOA with `USDC_TOP_UP_AMOUNT`
> - Approves and supplies USDC to Aave via Companion
> - Transfers resulting aUSDC back to your EOA
> - Displays final aUSDC balances for both Companion and EOA
> - Prints the supertransaction hash for reference

```bash
pnpm demo
```


#### 7) **Stop and remove containers/volumes**

```bash
pnpm mee:down
```


### 📝 Example output
```bash
🧭 Companion (chain 1): 0xCompanion...
📦 Supply amount (USDC): 100
💸 Funded 0xEOA... with 1000000 USDC (tx: 0x...)
⚙️  Executing Fusion quote…
✅ Supertransaction: 0xHash...
📈 aUSDC balance on Companion: 0
📈 aUSDC balance on EOA: 100
```