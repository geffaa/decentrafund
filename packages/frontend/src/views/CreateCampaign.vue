<template>
  <div class="create-page page-wrapper">
    <div class="container" style="max-width: 800px">
      <div class="section-header">
        <h1>Create <span class="gradient-text">Campaign</span></h1>
        <p>Launch your crowdfunding campaign backed by smart contracts</p>
      </div>

      <div v-if="!web3.isConnected" class="glass-card text-center">
        <h3>🦊 Connect Your Wallet</h3>
        <p class="text-secondary mt-sm">Connect MetaMask to create a campaign</p>
        <button class="btn btn-primary mt-lg" @click="web3.connectWallet()">Connect Wallet</button>
      </div>

      <div v-else>
        <div class="steps-indicator mb-lg">
          <div v-for="(s, i) in steps" :key="i" class="step" :class="{ active: currentStep === i, completed: currentStep > i }">
            <div class="step-dot">{{ currentStep > i ? '✓' : i + 1 }}</div>
            <span class="step-name text-sm">{{ s }}</span>
          </div>
        </div>

        <!-- Step 1: Basic Info -->
        <div v-if="currentStep === 0" class="glass-card-static animate-fade-in">
          <h3>📝 Basic Info</h3>
          <div class="form-group mt-lg">
            <label class="form-label">Title *</label>
            <input v-model="form.title" class="form-input" placeholder="Campaign title" />
          </div>
          <div class="form-group">
            <label class="form-label">Short Description</label>
            <input v-model="form.shortDesc" class="form-input" placeholder="One-line summary" />
          </div>
          <div class="form-group">
            <label class="form-label">Description *</label>
            <textarea v-model="form.description" class="form-textarea" rows="5" placeholder="Describe your campaign in detail..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select v-model="form.category" class="form-select">
              <option value="">Select category</option>
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Campaign Image (optional)</label>
            <input type="file" accept="image/*" class="form-input" @change="handleImageUpload" />
            <p v-if="form.imageHash" class="text-success text-sm mt-sm">✅ Image uploaded to IPFS</p>
          </div>
          <button class="btn btn-primary" :disabled="!form.title || !form.description || !form.category" @click="currentStep++">
            Next →
          </button>
        </div>

        <!-- Step 2: Funding -->
        <div v-if="currentStep === 1" class="glass-card-static animate-fade-in">
          <h3>💰 Funding</h3>
          <div class="form-group mt-lg">
            <label class="form-label">Target Amount (ETH) *</label>
            <input v-model.number="form.targetAmount" type="number" class="form-input" step="0.1" min="0.01" placeholder="e.g. 5" />
          </div>
          <div class="form-group">
            <label class="form-label">Duration (Days) *</label>
            <input v-model.number="form.durationDays" type="number" class="form-input" min="1" max="365" />
            <p class="form-hint">Campaign deadline: {{ deadlinePreview }}</p>
          </div>
          <div class="flex gap-md">
            <button class="btn btn-outline" @click="currentStep--">← Back</button>
            <button class="btn btn-primary" :disabled="!form.targetAmount || !form.durationDays" @click="currentStep++">
              Next →
            </button>
          </div>
        </div>

        <!-- Step 3: Milestones -->
        <div v-if="currentStep === 2" class="glass-card-static animate-fade-in">
          <h3>📋 Milestones</h3>
          <p class="text-secondary text-sm mt-sm mb-lg">
            Define milestones for fund release. Amounts must sum to {{ form.targetAmount }} ETH
          </p>

          <div
            v-for="(m, i) in form.milestones"
            :key="i"
            style="padding: 1rem; background: var(--bg-glass); border-radius: 12px; margin-bottom: 0.75rem"
          >
            <div class="flex justify-between mb-sm">
              <span class="text-sm font-semibold">Milestone {{ i + 1 }}</span>
              <button
                v-if="form.milestones.length > 1"
                class="btn btn-ghost btn-sm text-danger"
                @click="removeMilestone(i)"
              >
                Remove
              </button>
            </div>
            <input v-model="m.description" class="form-input mb-sm" placeholder="Milestone description" />
            <input v-model.number="m.amount" type="number" class="form-input" placeholder="Amount in ETH" step="0.01" />
          </div>

          <button class="btn btn-outline btn-sm mt-md" @click="addMilestone">+ Add Milestone</button>

          <p class="text-sm mt-md" :class="milestoneTotalValid ? 'text-success' : 'text-danger'">
            Total: {{ milestoneTotal.toFixed(3) }} / {{ form.targetAmount }} ETH
            <span v-if="milestoneTotalValid"> ✅</span>
          </p>

          <div class="flex gap-md mt-lg">
            <button class="btn btn-outline" @click="currentStep--">← Back</button>
            <button
              class="btn btn-primary"
              :disabled="!form.milestones.every(m => m.description && m.amount > 0) || !milestoneTotalValid"
              @click="currentStep++"
            >
              Review →
            </button>
          </div>
        </div>

        <!-- Step 4: Review & Launch -->
        <div v-if="currentStep === 3" class="glass-card-static animate-fade-in">
          <h3>🚀 Review & Launch</h3>
          <div class="review-grid mt-lg">
            <div>
              <span class="text-muted text-sm">Title</span>
              <p class="font-semibold">{{ form.title }}</p>
            </div>
            <div>
              <span class="text-muted text-sm">Category</span>
              <p class="font-semibold">{{ form.category }}</p>
            </div>
            <div>
              <span class="text-muted text-sm">Target</span>
              <p class="font-semibold">{{ form.targetAmount }} ETH</p>
            </div>
            <div>
              <span class="text-muted text-sm">Duration</span>
              <p class="font-semibold">{{ form.durationDays }} days</p>
            </div>
          </div>

          <div class="divider"></div>

          <h4>Milestones</h4>
          <div v-for="(m, i) in form.milestones" :key="i" class="flex justify-between items-center mt-sm" style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color)">
            <span class="text-sm">{{ i + 1 }}. {{ m.description }}</span>
            <span class="text-accent font-semibold text-sm">{{ m.amount }} ETH</span>
          </div>

          <div class="divider"></div>

          <p class="text-secondary text-sm mb-md">
            ⚠️ Creating this campaign will deploy a smart contract on Sepolia. You'll need SepoliaETH for gas fees.
          </p>

          <p v-if="deployStatus" class="text-center mb-lg" :class="deployStatus.includes('✅') ? 'text-success' : deployStatus.includes('❌') ? 'text-danger' : 'text-accent'">
            {{ deployStatus }}
          </p>

          <div class="flex gap-md">
            <button class="btn btn-outline" @click="currentStep--" :disabled="isDeploying">← Back</button>
            <button class="btn btn-accent btn-lg flex-1" :disabled="isDeploying" @click="deployCampaign">
              <span v-if="isDeploying" class="animate-spin">⟳</span>
              <span v-else>🚀 Deploy to Blockchain</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ethers } from 'ethers'
import { useWeb3Store } from '@/stores/web3'
import { useCampaignStore } from '@/stores/campaigns'

const router = useRouter()
const web3 = useWeb3Store()
const campaignStore = useCampaignStore()

const steps = ['Basic Info', 'Funding', 'Milestones', 'Review']
const currentStep = ref(0)
const categories = ['Technology', 'Education', 'Gaming', 'Environment', 'Health', 'Art', 'Community']
const isDeploying = ref(false)
const deployStatus = ref('')

const form = ref({
  title: '', shortDesc: '', description: '', category: '',
  imageHash: '', imageUrl: '', targetAmount: '', durationDays: 30,
  milestones: [{ description: '', amount: '' }],
})

const milestoneTotal = computed(() => form.value.milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0))
const milestoneTotalValid = computed(() => Math.abs(milestoneTotal.value - parseFloat(form.value.targetAmount)) < 0.0001)

const deadlinePreview = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + (form.value.durationDays || 30))
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

function addMilestone() { form.value.milestones.push({ description: '', amount: '' }) }
function removeMilestone(idx) { form.value.milestones.splice(idx, 1) }

async function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  try {
    const result = await campaignStore.uploadToIPFS(file)
    form.value.imageHash = result.hash
    form.value.imageUrl = result.url
  } catch (err) { console.error('Upload failed:', err) }
}

async function deployCampaign() {
  if (!web3.isConnected || isDeploying.value) return
  isDeploying.value = true
  deployStatus.value = '📝 Confirm transaction in MetaMask...'
  try {
    const factory = web3.getFactoryContract()
    if (!factory) throw new Error('Factory not available')
    const targetWei = ethers.parseEther(form.value.targetAmount.toString())
    const tx = await factory.createCampaign(
      form.value.title, form.value.description, form.value.imageHash || '',
      form.value.category, targetWei, form.value.durationDays,
      form.value.milestones.map(m => m.description),
      form.value.milestones.map(m => ethers.parseEther(m.amount.toString()))
    )
    deployStatus.value = '⛏️ Mining transaction...'
    const receipt = await tx.wait()
    deployStatus.value = '✅ Campaign deployed!'
    const event = receipt.logs.find(l => { try { return factory.interface.parseLog(l)?.name === 'CampaignCreated' } catch { return false } })
    if (event) {
      const addr = factory.interface.parseLog(event).args.campaignAddress
      setTimeout(() => router.push(`/campaign/${addr}`), 2000)
    }
  } catch (err) {
    deployStatus.value = `❌ Failed: ${err.reason || err.message}`
  } finally { isDeploying.value = false }
}
</script>

<style scoped>
.steps-indicator { display: flex; justify-content: space-between; position: relative; }
.steps-indicator::before { content: ''; position: absolute; top: 15px; left: 5%; right: 5%; height: 2px; background: var(--border-color); }
.step { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; position: relative; z-index: 1; }
.step-dot { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-secondary); border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; }
.step.active .step-dot { border-color: var(--primary); background: rgba(108,92,231,0.2); color: var(--primary-light); box-shadow: 0 0 12px rgba(108,92,231,0.3); }
.step.completed .step-dot { border-color: var(--success); background: rgba(0,184,148,0.2); color: var(--success); }
.step-name { color: var(--text-muted); }
.step.active .step-name { color: var(--text-primary); }

.review-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.mb-sm { margin-bottom: 0.5rem; }
</style>
