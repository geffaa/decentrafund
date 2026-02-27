<template>
  <div class="dashboard-page page-wrapper">
    <div class="container">
      <div v-if="!web3.isConnected" class="glass-card text-center">
        <h2>🦊 Connect Wallet</h2>
        <p class="text-secondary mt-sm">Connect MetaMask to view your dashboard</p>
        <button class="btn btn-primary mt-lg" @click="web3.connectWallet()">Connect Wallet</button>
      </div>

      <div v-else>
        <div class="section-header">
          <h1>My <span class="gradient-text">Dashboard</span></h1>
          <p class="font-mono text-secondary text-sm">{{ web3.account }}</p>
        </div>

        <!-- Tabs -->
        <div class="tabs mb-lg">
          <button class="tab" :class="{ active: activeTab === 'creator' }" @click="activeTab = 'creator'">🎯 Creator</button>
          <button class="tab" :class="{ active: activeTab === 'backer' }" @click="activeTab = 'backer'">💰 Backer</button>
          <button class="tab" :class="{ active: activeTab === 'notifications' }" @click="activeTab = 'notifications'">🔔 Notifications</button>
        </div>

        <!-- Creator Tab -->
        <div v-if="activeTab === 'creator'" class="animate-fade-in">
          <div class="grid grid-3 mb-lg">
            <div class="stat-card glass-card"><div class="stat-value gradient-text">{{ myCampaigns.length }}</div><div class="stat-label">Campaigns</div></div>
            <div class="stat-card glass-card"><div class="stat-value gradient-text">{{ totalRaised }} ETH</div><div class="stat-label">Total Raised</div></div>
            <div class="stat-card glass-card"><div class="stat-value gradient-text">{{ totalBackers }}</div><div class="stat-label">Total Backers</div></div>
          </div>

          <div class="flex justify-between items-center mb-md">
            <h3>My Campaigns</h3>
            <router-link to="/create" class="btn btn-primary btn-sm">+ New Campaign</router-link>
          </div>

          <div v-if="myCampaigns.length" class="grid grid-2 stagger">
            <CampaignCard v-for="c in myCampaigns" :key="c.id" :campaign="c" />
          </div>
          <div v-else class="empty-state glass-card-static">
            <p style="font-size:2rem">📋</p>
            <h3 class="mt-md">No campaigns yet</h3>
            <router-link to="/create" class="btn btn-primary mt-lg">Create Your First</router-link>
          </div>
        </div>

        <!-- Backer Tab -->
        <div v-if="activeTab === 'backer'" class="animate-fade-in">
          <div class="grid grid-2 mb-lg">
            <div class="stat-card glass-card"><div class="stat-value gradient-text">{{ myContributions.length }}</div><div class="stat-label">Backed</div></div>
            <div class="stat-card glass-card"><div class="stat-value gradient-text">{{ totalContributed }} ETH</div><div class="stat-label">Contributed</div></div>
          </div>

          <h3 class="mb-md">My Contributions</h3>
          <div v-if="myContributions.length" class="stagger">
            <div v-for="c in myContributions" :key="c.id" class="glass-card flex items-center gap-lg" style="padding:1rem 1.25rem;cursor:pointer" @click="$router.push(`/campaign/${c.campaign?.contractAddress || c.campaignId}`)">
              <div class="flex-1">
                <h4 class="text-sm">{{ c.campaign?.title || 'Campaign' }}</h4>
                <span class="badge badge-active text-xs mt-sm">{{ c.campaign?.status || 'ACTIVE' }}</span>
              </div>
              <span class="text-accent font-bold">{{ formatEth(c.amount) }} ETH</span>
            </div>
          </div>
          <div v-else class="empty-state glass-card-static">
            <p style="font-size:2rem">💰</p>
            <h3 class="mt-md">No contributions yet</h3>
            <router-link to="/explore" class="btn btn-primary mt-lg">Explore Campaigns</router-link>
          </div>
        </div>

        <!-- Notifications Tab -->
        <div v-if="activeTab === 'notifications'" class="animate-fade-in">
          <div v-if="notifications.length" class="stagger">
            <div v-for="n in notifications" :key="n.id" class="glass-card" :style="{ opacity: n.read ? 0.6 : 1, padding: '1rem 1.25rem' }">
              <div class="flex justify-between items-center">
                <h4 class="text-sm">{{ n.title }}</h4>
                <span class="text-xs text-muted">{{ new Date(n.createdAt).toLocaleDateString() }}</span>
              </div>
              <p class="text-secondary text-sm mt-sm">{{ n.message }}</p>
            </div>
          </div>
          <div v-else class="empty-state glass-card-static">
            <p style="font-size:2rem">🔔</p>
            <h3 class="mt-md">No notifications</h3>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ethers } from 'ethers'
import { useWeb3Store } from '@/stores/web3'
import CampaignCard from '@/components/CampaignCard.vue'
import axios from 'axios'

const web3 = useWeb3Store()
const activeTab = ref('creator')
const dashboardData = ref(null)

const API = import.meta.env.VITE_API_URL || '/api'

const myCampaigns = computed(() => dashboardData.value?.creator?.campaigns || demoCampaigns)
const myContributions = computed(() => dashboardData.value?.backer?.contributions || demoContributions)
const notifications = computed(() => dashboardData.value?.notifications || [])
const totalRaised = computed(() => formatEth(dashboardData.value?.creator?.totalRaised || '7300000000000000000'))
const totalContributed = computed(() => formatEth(dashboardData.value?.backer?.totalContributed || '2500000000000000000'))
const totalBackers = computed(() => myCampaigns.value.reduce((s, c) => s + (c.totalBackers || 0), 0))

function formatEth(w) { try { return parseFloat(ethers.formatEther(w)).toFixed(3) } catch { return '0' } }

const demoCampaigns = [
  { id: '1', contractAddress: '0x001', title: 'GreenTech Solar', category: 'Technology', status: 'ACTIVE', targetAmount: '10000000000000000000', currentAmount: '7300000000000000000', deadline: new Date(Date.now() + 12*86400000).toISOString(), totalBackers: 42 },
]
const demoContributions = [
  { id: '1', amount: '2500000000000000000', campaign: { title: 'DeFi Education', status: 'ACTIVE', contractAddress: '0x002' } },
]

onMounted(async () => {
  if (web3.isConnected) {
    try {
      const { data } = await axios.get(`${API}/users/${web3.account}/dashboard`)
      dashboardData.value = data.dashboard
    } catch (e) { console.warn('Dashboard fetch failed, using demo data') }
  }
})
</script>

<style scoped>
.tabs { display:flex; gap:0.25rem; background:var(--bg-glass); border-radius:var(--radius-md); padding:0.25rem; }
.tab { padding:0.625rem 1.25rem; border:none; background:none; color:var(--text-secondary); font-family:var(--font-family); font-size:0.9rem; font-weight:500; border-radius:var(--radius-sm); cursor:pointer; transition:all var(--transition-fast); }
.tab.active { background:var(--bg-card); color:var(--text-primary); box-shadow:var(--shadow-sm); }
.tab:hover:not(.active) { color:var(--text-primary); }
</style>
