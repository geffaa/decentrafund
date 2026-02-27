<template>
  <nav class="navbar">
    <div class="container navbar-inner">
      <router-link to="/" class="logo">
        <span class="logo-icon">◆</span>
        <span class="logo-text">Decentra<span class="gradient-text">Fund</span></span>
      </router-link>

      <div class="nav-links" :class="{ active: menuOpen }">
        <router-link to="/" class="nav-link" @click="menuOpen = false">Home</router-link>
        <router-link to="/explore" class="nav-link" @click="menuOpen = false">Explore</router-link>
        <router-link to="/create" class="nav-link" @click="menuOpen = false">Create</router-link>
        <router-link to="/dashboard" class="nav-link" @click="menuOpen = false">Dashboard</router-link>
        <router-link to="/analytics" class="nav-link" @click="menuOpen = false">Analytics</router-link>
      </div>

      <div class="nav-actions">
        <button
          v-if="!web3.isConnected"
          class="btn btn-primary btn-sm"
          :disabled="web3.isConnecting"
          @click="web3.connectWallet()"
        >
          <span v-if="web3.isConnecting" class="animate-spin">⟳</span>
          <span v-else>🦊 Connect Wallet</span>
        </button>

        <div v-else class="wallet-info">
          <span v-if="!web3.isCorrectNetwork" class="network-warning" @click="web3.switchToSepolia()">
            ⚠️ Wrong Network
          </span>
          <span v-else class="network-badge">
            <span class="dot dot-success"></span>
            Sepolia
          </span>
          <button class="btn btn-outline btn-sm wallet-btn" @click="showWalletMenu = !showWalletMenu">
            {{ web3.shortAddress }}
          </button>

          <div v-if="showWalletMenu" class="wallet-dropdown glass-card-static">
            <a :href="'https://sepolia.etherscan.io/address/' + web3.account" target="_blank" class="dropdown-item">
              View on Etherscan ↗
            </a>
            <button class="dropdown-item danger" @click="web3.disconnectWallet(); showWalletMenu = false">
              Disconnect
            </button>
          </div>
        </div>

        <button class="btn btn-icon mobile-menu" @click="menuOpen = !menuOpen">
          {{ menuOpen ? '✕' : '☰' }}
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useWeb3Store } from '@/stores/web3'

const web3 = useWeb3Store()
const menuOpen = ref(false)
const showWalletMenu = ref(false)
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 10, 26, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  padding: 0.75rem 0;
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 800;
  text-decoration: none;
  color: var(--text-primary);
}

.logo-icon {
  font-size: 1.5rem;
  color: var(--primary-light);
  animation: float 3s ease-in-out infinite;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-link {
  padding: 0.5rem 0.875rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text-primary);
  background: var(--bg-glass);
}

.nav-link.router-link-exact-active {
  color: var(--primary-light);
  background: rgba(108, 92, 231, 0.1);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.network-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  padding: 0.25rem 0.625rem;
  background: var(--bg-glass);
  border-radius: var(--radius-full);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-success {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
}

.network-warning {
  font-size: 0.75rem;
  color: var(--warning);
  cursor: pointer;
  animation: pulse 2s infinite;
}

.wallet-btn {
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.wallet-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  min-width: 180px;
  padding: 0.5rem;
  z-index: 50;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  color: var(--text-primary);
  background: var(--bg-glass);
}

.dropdown-item.danger:hover {
  color: var(--danger);
  background: rgba(225, 112, 85, 0.1);
}

.mobile-menu {
  display: none;
  font-size: 1.25rem;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    background: rgba(10, 10, 26, 0.95);
    backdrop-filter: blur(20px);
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .nav-links.active {
    display: flex;
  }

  .mobile-menu {
    display: flex;
  }
}
</style>
