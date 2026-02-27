<template>
  <div class="campaign-card glass-card" @click="$router.push(`/campaign/${campaign.contractAddress || campaign.id}`)">
    <div class="card-image">
      <img
        :src="cardImage"
        :alt="campaign.title"
        loading="lazy"
      />
      <span class="badge" :class="'badge-' + campaign.status.toLowerCase()">
        {{ campaign.status }}
      </span>
      <span class="badge badge-category card-category">{{ campaign.category }}</span>
    </div>

    <div class="card-body">
      <h3 class="card-title">{{ campaign.title }}</h3>
      <p class="card-desc text-secondary text-sm">
        {{ truncateText(campaign.shortDesc || campaign.description, 100) }}
      </p>

      <div class="card-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-stats">
          <span class="font-semibold">{{ formatEth(campaign.currentAmount) }} ETH</span>
          <span class="text-muted text-sm">of {{ formatEth(campaign.targetAmount) }} ETH</span>
        </div>
      </div>

      <div class="card-meta">
        <div class="meta-item">
          <span class="meta-label">Backers</span>
          <span class="meta-value">{{ campaign.totalBackers || campaign._count?.contributions || 0 }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Days Left</span>
          <span class="meta-value" :class="{ 'text-danger': daysLeft <= 3 }">{{ daysLeft }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Progress</span>
          <span class="meta-value text-accent">{{ progressPercent }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ethers } from 'ethers'

const props = defineProps({
  campaign: { type: Object, required: true }
})

const progressPercent = computed(() => {
  const current = BigInt(props.campaign.currentAmount || '0')
  const target = BigInt(props.campaign.targetAmount || '1')
  if (target === 0n) return 0
  const pct = Number((current * 100n) / target)
  return Math.min(pct, 100)
})

const cardImage = computed(() => {
  const c = props.campaign
  if (c.imageUrl && c.imageUrl.startsWith('http')) return c.imageUrl
  if (c.imageHash && c.imageHash.length > 0) return `https://gateway.pinata.cloud/ipfs/${c.imageHash}`
  return `https://picsum.photos/seed/${c.id || c.contractAddress}/400/250`
})

const daysLeft = computed(() => {
  const deadline = new Date(props.campaign.deadline)
  const now = new Date()
  const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
})

function formatEth(weiStr) {
  if (!weiStr) return '0'
  try {
    return parseFloat(ethers.formatEther(weiStr)).toFixed(3)
  } catch {
    return '0'
  }
}

function truncateText(text, length) {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
}
</script>

<style scoped>
.campaign-card {
  cursor: pointer;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.card-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.campaign-card:hover .card-image img {
  transform: scale(1.05);
}

.card-image .badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.card-category {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
}

.card-body {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.card-desc {
  margin-bottom: 1rem;
  line-height: 1.5;
  flex: 1;
}

.card-progress {
  margin-bottom: 1rem;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.meta-item {
  text-align: center;
}

.meta-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-value {
  font-weight: 700;
  font-size: 0.95rem;
}
</style>
