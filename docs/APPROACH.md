## 📄 Approach & Challenges

### Approach
We designed the solution to demonstrate a **Biconomy Fusion supertransaction** interacting with **Aave v3** on a **forked Ethereum mainnet** using a **local MEE node**.

Our approach was:
1. **Local environment with Docker**
    - Run **Anvil** to fork mainnet so USDC and Aave contracts are already deployed.
    - Run **Redis** as required by the MEE node.
    - Run **MEE node** locally to execute supertransactions.

2. **Single TypeScript script (`pnpm demo`)**
    - Impersonate a USDC whale to fund our EOA.
    - Approve and supply USDC to Aave on behalf of the Companion.
    - Transfer the resulting aUSDC back to our EOA.
    - Print transaction hash and final balances.

3. **Config-driven setup**
    - All addresses, RPC URLs, and amounts are configurable via `.env`.
    - Minimal ABIs to keep the code easy to review.

---

### Challenges & Solutions
- **First-time working with Fusion supertransactions**: This was initial hands-on experience with Fusion and its orchestration flow.  
  ➡️ Addressed by starting with simple, minimal instructions and gradually composing them into the final multi-step transaction.

- **Transaction observability**: Evaluators should see transaction details.  
  ➡️ Logged hash and balances in console; optionally viewable in MEE Explorer with a custom node URL.

---
