<template>
  <div class="explore-page page-wrapper">
    <div class="container">
      <div class="section-header">
        <h1>Explore <span class="gradient-text">Campaigns</span></h1>
        <p>Discover and back innovative projects powered by blockchain</p>
      </div>

      <!-- Filters -->
      <div class="filters glass-card-static">
        <div class="filter-row">
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              class="form-input"
              placeholder="🔍 Search campaigns..."
              @input="debouncedSearch"
            />
          </div>

          <select v-model="selectedCategory" class="form-select" @change="fetchData">
            <option value="">All Categories</option>
            <option value="Technology">Technology</option>
            <option value="Education">Education</option>
            <option value="Gaming">Gaming</option>
            <option value="Environment">Environment</option>
            <option value="Health">Health</option>
            <option value="Art">Art</option>
            <option value="Community">Community</option>
          </select>

          <select v-model="selectedStatus" class="form-select" @change="fetchData">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="FAILED">Failed</option>
          </select>

          <select v-model="sortBy" class="form-select" @change="fetchData">
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="totalBackers:desc">Most Backed</option>
          </select>
        </div>
      </div>

      <!-- Campaign Grid -->
      <div v-if="store.isLoading" class="grid grid-3 mt-lg">
        <div v-for="i in 6" :key="i" class="glass-card" style="padding: 0">
          <div class="skeleton skeleton-image"></div>
          <div style="padding: 1.25rem">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width: 80%"></div>
          </div>
        </div>
      </div>

      <div v-else-if="displayedCampaigns.length > 0" class="grid grid-3 mt-lg stagger">
        <CampaignCard
          v-for="campaign in displayedCampaigns"
          :key="campaign.id"
          :campaign="campaign"
        />
      </div>

      <div v-else class="empty-state mt-xl">
        <div style="font-size: 3rem; margin-bottom: 1rem">🔍</div>
        <h3>No campaigns found</h3>
        <p class="text-secondary mt-sm">Try adjusting your filters or search query</p>
        <router-link to="/create" class="btn btn-primary mt-lg">Create a Campaign</router-link>
      </div>

      <!-- Pagination -->
      <div v-if="store.pagination.pages > 1" class="pagination mt-xl">
        <button
          class="btn btn-outline btn-sm"
          :disabled="store.pagination.page <= 1"
          @click="changePage(store.pagination.page - 1)"
        >
          ← Previous
        </button>
        <span class="text-secondary">
          Page {{ store.pagination.page }} of {{ store.pagination.pages }}
        </span>
        <button
          class="btn btn-outline btn-sm"
          :disabled="store.pagination.page >= store.pagination.pages"
          @click="changePage(store.pagination.page + 1)"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCampaignStore } from '@/stores/campaigns'
import CampaignCard from '@/components/CampaignCard.vue'

const store = useCampaignStore()

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const sortBy = ref('createdAt:desc')
let searchTimeout = null

// Demo fallback data
const demoCampaigns = [
  {
    id: '1', contractAddress: '0x001', title: 'GreenTech Solar Initiative',
    description: 'Building affordable solar-powered devices for off-grid communities.',
    category: 'Technology', status: 'ACTIVE',
    targetAmount: '10000000000000000000', currentAmount: '7300000000000000000',
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    totalBackers: 42,
  },
  {
    id: '2', contractAddress: '0x002', title: 'DeFi Education Platform',
    description: 'Free educational platform teaching blockchain concepts.',
    category: 'Education', status: 'ACTIVE',
    targetAmount: '5000000000000000000', currentAmount: '3200000000000000000',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    totalBackers: 28,
  },
  {
    id: '3', contractAddress: '0x003', title: 'Web3 Gaming DAO',
    description: 'Community-governed gaming platform with true ownership.',
    category: 'Gaming', status: 'SUCCESSFUL',
    targetAmount: '15000000000000000000', currentAmount: '15000000000000000000',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalBackers: 87,
  },
  {
    id: '4', contractAddress: '0x004', title: 'Clean Water DAO',
    description: 'Decentralized funding for clean water projects in developing nations.',
    category: 'Environment', status: 'ACTIVE',
    targetAmount: '8000000000000000000', currentAmount: '2100000000000000000',
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    totalBackers: 15,
  },
  {
    id: '5', contractAddress: '0x005', title: 'AI Health Diagnostics',
    description: 'On-chain AI diagnostics with verified medical data.',
    category: 'Health', status: 'ACTIVE',
    targetAmount: '20000000000000000000', currentAmount: '11500000000000000000',
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    totalBackers: 64,
  },
  {
    id: '6', contractAddress: '0x006', title: 'Decentralized Art Gallery',
    description: 'Virtual art gallery for artists to showcase work on-chain.',
    category: 'Art', status: 'ACTIVE',
    targetAmount: '3000000000000000000', currentAmount: '1800000000000000000',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    totalBackers: 22,
  },
]

const displayedCampaigns = computed(() => {
  let list = store.campaigns.length > 0 ? store.campaigns : demoCampaigns
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
  }
  if (selectedCategory.value) {
    list = list.filter(c => c.category === selectedCategory.value)
  }
  if (selectedStatus.value) {
    list = list.filter(c => c.status === selectedStatus.value)
  }
  return list
})

function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(fetchData, 300)
}

function fetchData() {
  const [sort, order] = sortBy.value.split(':')
  store.fetchCampaigns({
    page: store.pagination.page,
    category: selectedCategory.value || undefined,
    status: selectedStatus.value || undefined,
    search: searchQuery.value || undefined,
    sort,
    order,
  })
}

function changePage(page) {
  store.pagination.page = page
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.filters {
  padding: 1.25rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 2;
  min-width: 200px;
}

.form-select {
  flex: 1;
  min-width: 150px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}
</style>
