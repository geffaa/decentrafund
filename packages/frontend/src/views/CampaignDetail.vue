<template>
  <div class="detail-page page-wrapper">
    <div class="container">
      <router-link to="/explore" class="btn btn-ghost mb-lg">← Back to Campaigns</router-link>

      <div class="detail-grid">
        <!-- Left: Main Content -->
        <div class="detail-main">
          <div class="detail-image glass-card-static" style="padding: 0; overflow: hidden">
            <img :src="campaignImage" :alt="campaign.title" />
          </div>

          <div class="glass-card-static mt-lg">
            <div class="flex items-center gap-md mb-md">
              <span class="badge" :class="'badge-' + campaign.status.toLowerCase()">{{ campaign.status }}</span>
              <span class="badge badge-category">{{ campaign.category }}</span>
            </div>

            <h1>{{ campaign.title }}</h1>

            <div class="creator-info mt-md flex items-center gap-md">
              <div class="avatar">{{ (campaign.creator?.username || campaign.creator?.walletAddress || '?')[0].toUpperCase() }}</div>
              <div>
                <p class="text-sm font-semibold">{{ campaign.creator?.username || 'Anonymous' }}</p>
                <p class="text-xs text-muted font-mono">{{ shortenAddress(campaign.creator?.walletAddress) }}</p>
              </div>
            </div>

            <div class="divider"></div>

            <h3>About This Campaign</h3>
            <p class="text-secondary mt-sm" style="line-height: 1.8; white-space: pre-wrap">{{ campaign.description }}</p>
          </div>

          <!-- Milestones -->
          <div class="glass-card-static mt-lg">
            <h3>📋 Milestones</h3>
            <div class="milestones-list mt-md">
              <div
                v-for="(milestone, idx) in milestones"
                :key="idx"
                class="milestone-item"
                :class="{ active: idx === campaign.currentMilestone, completed: milestone.status === 2 || milestone.status === 'APPROVED' }"
              >
                <div class="milestone-marker">
                  <span v-if="milestone.status === 2 || milestone.status === 'APPROVED'">✓</span>
                  <span v-else-if="milestone.status === 1 || milestone.status === 'VOTING'">🗳️</span>
                  <span v-else>{{ idx + 1 }}</span>
                </div>
                <div class="milestone-content">
                  <h4>{{ milestone.description }}</h4>
                  <div class="flex items-center gap-md mt-sm text-sm">
                    <span class="text-accent font-semibold">{{ formatEth(milestone.amount) }} ETH</span>
                    <span class="badge" :class="getMilestoneStatusClass(milestone)">
                      {{ getMilestoneStatusText(milestone) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Backers -->
          <div class="glass-card-static mt-lg">
            <h3>👥 Recent Backers</h3>
            <div v-if="contributions.length > 0" class="backers-list mt-md">
              <div v-for="contrib in contributions" :key="contrib.id" class="backer-item">
                <div class="avatar avatar-sm">{{ (contrib.user?.username || contrib.user?.walletAddress || '?')[0].toUpperCase() }}</div>
                <div class="flex-1">
                  <span class="text-sm font-semibold">{{ contrib.user?.username || shortenAddress(contrib.user?.walletAddress) }}</span>
                </div>
                <span class="text-accent font-semibold text-sm">{{ formatEth(contrib.amount) }} ETH</span>
              </div>
            </div>
            <p v-else class="text-secondary text-sm mt-md">No contributions yet. Be the first!</p>
          </div>
        </div>

        <!-- Right: Sidebar -->
        <div class="detail-sidebar">
          <!-- Funding Card -->
          <div class="glass-card-static funding-card">
            <div class="funding-amount">
              <span class="font-bold" style="font-size: 1.75rem">{{ formatEth(campaign.currentAmount) }}</span>
              <span class="text-secondary"> ETH raised</span>
            </div>
            <p class="text-muted text-sm">of {{ formatEth(campaign.targetAmount) }} ETH goal</p>

            <div class="progress-bar mt-md" style="height: 12px">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <p class="text-accent font-semibold mt-sm text-sm">{{ progressPercent }}% funded</p>

            <div class="funding-stats grid grid-3 mt-lg" style="gap: 0.5rem">
              <div class="text-center">
                <div class="font-bold">{{ campaign.totalBackers || 0 }}</div>
                <div class="text-xs text-muted">Backers</div>
              </div>
              <div class="text-center">
                <div class="font-bold" :class="{ 'text-danger': daysLeft <= 3 }">{{ daysLeft }}</div>
                <div class="text-xs text-muted">Days Left</div>
              </div>
              <div class="text-center">
                <div class="font-bold">{{ milestones.length }}</div>
                <div class="text-xs text-muted">Milestones</div>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Contribute Form -->
            <div v-if="campaign.status === 'ACTIVE' || campaign.status === 0">
              <label class="form-label">Contribute (ETH)</label>
              <input
                v-model="contributeAmount"
                type="number"
                class="form-input"
                placeholder="0.1"
                step="0.01"
                min="0.001"
              />
              <button
                class="btn btn-primary btn-lg"
                style="width: 100%; margin-top: 0.75rem"
                :disabled="!web3.isConnected || !contributeAmount || isContributing"
                @click="handleContribute"
              >
                <span v-if="isContributing" class="animate-spin">⟳</span>
                <span v-else>💰 Fund This Campaign</span>
              </button>

              <p v-if="!web3.isConnected" class="text-warning text-xs mt-sm text-center">
                Connect your wallet to contribute
              </p>
            </div>

            <div v-else class="text-center">
              <p class="text-secondary">This campaign is no longer accepting contributions.</p>
            </div>
          </div>

          <!-- Contract Info -->
          <div class="glass-card-static mt-lg">
            <h4>🔗 On-Chain</h4>
            <div class="contract-info mt-md">
              <div class="info-row">
                <span class="text-muted text-sm">Contract</span>
                <a
                  :href="`https://sepolia.etherscan.io/address/${campaign.contractAddress}`"
                  target="_blank"
                  class="text-sm font-mono"
                >
                  {{ shortenAddress(campaign.contractAddress) }} ↗
                </a>
              </div>
              <div class="info-row" v-if="campaign.txHash">
                <span class="text-muted text-sm">Tx Hash</span>
                <a
                  :href="`https://sepolia.etherscan.io/tx/${campaign.txHash}`"
                  target="_blank"
                  class="text-sm font-mono"
                >
                  {{ shortenAddress(campaign.txHash) }} ↗
                </a>
              </div>
              <div class="info-row">
                <span class="text-muted text-sm">Network</span>
                <span class="text-sm">Sepolia Testnet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ethers } from 'ethers'
import { useWeb3Store } from '@/stores/web3'
import { useCampaignStore } from '@/stores/campaigns'

const route = useRoute()
const web3 = useWeb3Store()
const campaignStore = useCampaignStore()

const id = computed(() => route.params.id)
const contributeAmount = ref('')
const isContributing = ref(false)

// Demo campaign
const defaultCampaign = {
  title: 'GreenTech Solar Initiative',
  description: 'Building affordable solar-powered devices for off-grid communities in Southeast Asia. Our mission is to provide sustainable energy solutions that can transform lives.\n\nWe are developing compact, efficient solar panels that can power essential devices in areas without reliable electricity. Our team of engineers and environmental scientists has been working on this technology for over 2 years.\n\nFunds will be used for:\n- Research & Development (40%)\n- Manufacturing prototype units (30%)\n- Community deployment & testing (20%)\n- Marketing & outreach (10%)',
  category: 'Technology',
  status: 'ACTIVE',
  targetAmount: '10000000000000000000',
  currentAmount: '7300000000000000000',
  deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
  totalBackers: 42,
  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
  creator: { username: 'solar_pioneer', walletAddress: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12' },
  currentMilestone: 1,
}

const defaultMilestones = [
  { description: 'MVP Development & Testing', amount: '3000000000000000000', status: 'APPROVED' },
  { description: 'Beta Launch & Community Testing', amount: '3000000000000000000', status: 'VOTING' },
  { description: 'Final Release & Deployment', amount: '4000000000000000000', status: 'PENDING' },
]

const defaultContributions = [
  { id: '1', user: { username: 'web3_enthusiast', walletAddress: '0x1111' }, amount: '2000000000000000000' },
  { id: '2', user: { username: null, walletAddress: '0x2222222222222222222222222222222222222222' }, amount: '1500000000000000000' },
  { id: '3', user: { username: 'crypto_backer', walletAddress: '0x3333' }, amount: '1000000000000000000' },
]

const campaign = computed(() => campaignStore.currentCampaign || defaultCampaign)
const milestones = computed(() => campaign.value.milestones || defaultMilestones)
const contributions = computed(() => campaign.value.contributions || defaultContributions)

const campaignImage = computed(() => {
  const c = campaign.value
  if (c.imageUrl && c.imageUrl.startsWith('http')) return c.imageUrl
  if (c.imageHash && c.imageHash.length > 0) return `https://gateway.pinata.cloud/ipfs/${c.imageHash}`
  return `https://picsum.photos/seed/${id.value}/800/400`
})

const progressPercent = computed(() => {
  const current = BigInt(campaign.value.currentAmount || '0')
  const target = BigInt(campaign.value.targetAmount || '1')
  return Math.min(Number((current * 100n) / target), 100)
})

const daysLeft = computed(() => {
  const deadline = new Date(campaign.value.deadline)
  return Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)))
})

function shortenAddress(addr) {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatEth(weiStr) {
  if (!weiStr) return '0'
  try { return parseFloat(ethers.formatEther(weiStr)).toFixed(3) }
  catch { return '0' }
}

function getMilestoneStatusText(m) {
  const s = typeof m.status === 'number' ? ['Pending', 'Voting', 'Approved', 'Rejected'][m.status] : m.status
  return s || 'Pending'
}

function getMilestoneStatusClass(m) {
  const map = { 0: 'badge-cancelled', 1: 'badge-active', 2: 'badge-successful', 3: 'badge-failed',
    PENDING: 'badge-cancelled', VOTING: 'badge-active', APPROVED: 'badge-successful', REJECTED: 'badge-failed' }
  return map[m.status] || 'badge-cancelled'
}

async function handleContribute() {
  if (!web3.isConnected || !contributeAmount.value) return
  isContributing.value = true
  try {
    const contract = web3.getCampaignContract(campaign.value.contractAddress)
    const tx = await contract.contribute({
      value: ethers.parseEther(contributeAmount.value.toString()),
    })
    await tx.wait()
    contributeAmount.value = ''
    // Refresh campaign data
    await campaignStore.fetchCampaignById(id.value)
  } catch (err) {
    console.error('Contribute error:', err)
  } finally {
    isContributing.value = false
  }
}

onMounted(() => {
  campaignStore.fetchCampaignById(id.value)
})
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
  align-items: start;
}

.detail-image img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.creator-info .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: white;
}

/* Milestones */
.milestones-list {
  position: relative;
}

.milestone-item {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  position: relative;
}

.milestone-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 17px;
  top: 48px;
  bottom: 0;
  width: 2px;
  background: var(--border-color);
}

.milestone-item.completed::after {
  background: var(--success);
}

.milestone-marker {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-glass);
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.milestone-item.completed .milestone-marker {
  background: rgba(0, 184, 148, 0.2);
  border-color: var(--success);
  color: var(--success);
}

.milestone-item.active .milestone-marker {
  background: rgba(108, 92, 231, 0.2);
  border-color: var(--primary-light);
  color: var(--primary-light);
  box-shadow: 0 0 10px rgba(108, 92, 231, 0.3);
}

/* Sidebar */
.funding-card {
  position: sticky;
  top: 5rem;
}

/* Backers */
.backer-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.backer-item:last-child {
  border-bottom: none;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  color: white;
  flex-shrink: 0;
}

/* Contract Info */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.info-row:last-child {
  border-bottom: none;
}

@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .funding-card {
    position: static;
  }
}
</style>
