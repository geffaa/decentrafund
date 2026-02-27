<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo">
            <span class="logo-icon">◆</span>
            <span>Decentra<span class="gradient-text">Fund</span></span>
          </div>
          <p class="text-secondary text-sm mt-sm">
            Decentralized crowdfunding platform powered by Ethereum blockchain.
            Transparent, milestone-based fund release.
          </p>
        </div>

        <div class="footer-links">
          <h4>Platform</h4>
          <router-link to="/explore">Explore Campaigns</router-link>
          <router-link to="/create">Create Campaign</router-link>
          <router-link to="/dashboard">Dashboard</router-link>
          <router-link to="/analytics">Analytics</router-link>
        </div>

        <div class="footer-links">
          <h4>Resources</h4>
          <a href="https://sepolia.etherscan.io" target="_blank">Sepolia Etherscan ↗</a>
          <a href="https://metamask.io" target="_blank">Get MetaMask ↗</a>
          <a href="https://sepoliafaucet.com" target="_blank">Get Test ETH ↗</a>
        </div>

        <div class="footer-links">
          <h4>Tech Stack</h4>
          <span class="text-secondary text-sm">Solidity • Hardhat</span>
          <span class="text-secondary text-sm">Vue 3 • ethers.js</span>
          <span class="text-secondary text-sm">Node.js • PostgreSQL</span>
          <span class="text-secondary text-sm">IPFS • OpenZeppelin</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="footer-bottom">
        <p class="text-muted text-sm">
          © 2026 DecentraFund. Built as a Full-Stack Blockchain Developer Portfolio.
        </p>
        <p class="text-muted text-sm">
          Deployed on Sepolia Testnet — No real funds involved.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 3rem 0 1.5rem;
  margin-top: 4rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 2rem;
}

.footer-brand .logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
}

.logo-icon {
  color: var(--primary-light);
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-links h4 {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.footer-links a {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.footer-links a:hover {
  color: var(--primary-light);
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
