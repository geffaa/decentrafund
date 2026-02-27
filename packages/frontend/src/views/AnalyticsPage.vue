<template>
  <div class="analytics-page page-wrapper">
    <div class="container">
      <div class="section-header">
        <h1>Platform <span class="gradient-text">Analytics</span></h1>
        <p>Real-time insights of the DecentraFund ecosystem</p>
      </div>

      <!-- Overview Stats -->
      <div class="grid grid-4 stagger mb-lg">
        <div class="stat-card glass-card"><div class="stat-value gradient-text">{{ stats.totalCampaigns }}</div><div class="stat-label">Total Campaigns</div></div>
        <div class="stat-card glass-card"><div class="stat-value gradient-text">{{ stats.totalFunded }} ETH</div><div class="stat-label">Total Funded</div></div>
        <div class="stat-card glass-card"><div class="stat-value gradient-text">{{ stats.totalContributions }}</div><div class="stat-label">Contributions</div></div>
        <div class="stat-card glass-card"><div class="stat-value gradient-text">{{ stats.successRate }}%</div><div class="stat-label">Success Rate</div></div>
      </div>

      <div class="grid grid-2">
        <!-- Top Campaigns -->
        <div class="glass-card-static">
          <h3>🏆 Top Campaigns</h3>
          <div class="top-list mt-md">
            <div v-for="(c, i) in topCampaigns" :key="c.id" class="top-item">
              <span class="rank">#{{ i + 1 }}</span>
              <div class="flex-1">
                <h4 class="text-sm">{{ c.title }}</h4>
                <span class="text-xs text-muted">{{ c.totalBackers }} backers</span>
              </div>
              <span class="text-accent font-bold text-sm">{{ formatEth(c.currentAmount) }} ETH</span>
            </div>
          </div>
        </div>

        <!-- Recent Campaigns -->
        <div class="glass-card-static">
          <h3>🕐 Recent Campaigns</h3>
          <div class="top-list mt-md">
            <div v-for="c in recentCampaigns" :key="c.id" class="top-item">
              <span class="badge" :class="'badge-' + c.status.toLowerCase()" style="font-size:0.65rem">{{ c.status }}</span>
              <div class="flex-1">
                <h4 class="text-sm">{{ c.title }}</h4>
                <span class="text-xs text-muted">{{ c.category }}</span>
              </div>
              <span class="text-secondary text-xs">{{ new Date(c.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="glass-card-static mt-lg">
        <h3>📊 Categories</h3>
        <div class="categories-grid mt-md">
          <div v-for="cat in categoryStats" :key="cat.category" class="cat-item">
            <div class="flex justify-between items-center mb-sm">
              <span class="font-semibold text-sm">{{ cat.category }}</span>
              <span class="text-accent text-sm">{{ cat._count.id }} campaigns</span>
            </div>
            <div class="progress-bar" style="height:6px">
              <div class="progress-fill" :style="{ width: (cat._count.id / maxCatCount * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- On-Chain Info -->
      <div class="glass-card-static mt-lg text-center">
        <h3>🔗 Blockchain Info</h3>
        <div class="grid grid-3 mt-md">
          <div><span class="text-muted text-sm">Network</span><p class="font-semibold mt-sm">Sepolia Testnet</p></div>
          <div><span class="text-muted text-sm">Contract</span><p class="font-mono text-sm mt-sm"><a :href="etherscanUrl" target="_blank" class="text-accent">View on Etherscan ↗</a></p></div>
          <div><span class="text-muted text-sm">Chain ID</span><p class="font-semibold mt-sm">11155111</p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ethers } from 'ethers'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'
const factoryAddr = import.meta.env.VITE_CONTRACT_FACTORY_ADDRESS || ''
const etherscanUrl = computed(() => `https://sepolia.etherscan.io/address/${factoryAddr}`)

const raw = ref(null)
const stats = computed(() => raw.value?.overview || { totalCampaigns: 150, totalFunded: '2500', totalContributions: 5200, successRate: 89 })
const topCampaigns = computed(() => raw.value?.topCampaigns || demoTop)
const recentCampaigns = computed(() => raw.value?.recentCampaigns || demoRecent)
const categoryStats = computed(() => raw.value?.categoryStats || demoCategories)
const maxCatCount = computed(() => Math.max(...categoryStats.value.map(c => c._count.id), 1))

function formatEth(w) { try { return parseFloat(ethers.formatEther(w)).toFixed(2) } catch { return w } }

const demoTop = [
  { id: '1', title: 'GreenTech Solar', totalBackers: 42, currentAmount: '7300000000000000000' },
  { id: '3', title: 'Web3 Gaming DAO', totalBackers: 87, currentAmount: '15000000000000000000' },
  { id: '5', title: 'AI Health Diagnostics', totalBackers: 64, currentAmount: '11500000000000000000' },
]
const demoRecent = [
  { id: '6', title: 'Decentralized Art Gallery', category: 'Art', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: '5', title: 'AI Health Diagnostics', category: 'Health', status: 'ACTIVE', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', title: 'Clean Water DAO', category: 'Environment', status: 'ACTIVE', createdAt: new Date(Date.now() - 2*86400000).toISOString() },
]
const demoCategories = [
  { category: 'Technology', _count: { id: 45 } },
  { category: 'Education', _count: { id: 28 } },
  { category: 'Gaming', _count: { id: 32 } },
  { category: 'Environment', _count: { id: 18 } },
  { category: 'Health', _count: { id: 15 } },
  { category: 'Art', _count: { id: 12 } },
]

onMounted(async () => {
  try {
    const { data } = await axios.get(`${API}/analytics/overview`)
    raw.value = data.analytics
  } catch (e) { console.warn('Analytics fetch failed, using demo data') }
})
</script>

<style scoped>
.top-list { display:flex; flex-direction:column; gap:0.5rem; }
.top-item { display:flex; align-items:center; gap:0.75rem; padding:0.75rem; background:var(--bg-glass); border-radius:var(--radius-sm); }
.rank { font-weight:800; color:var(--primary-light); min-width:2rem; }
.categories-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:1rem; }
@media(max-width:640px) { .categories-grid { grid-template-columns:1fr; } }
</style>
