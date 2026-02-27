<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-glow"></div>
      <div class="container hero-container text-center">
        <span class="badge mb-md">Built on Ethereum</span>
        <h1 class="hero-title">
          Bring your ideas to life.<br />
          <span class="text-secondary">Fund them transparently.</span>
        </h1>
        <p class="hero-desc text-secondary">
          DecentraFund is the crowdfunding platform powered by smart contracts.
          Milestone-based fund releases give backers peace of mind.
        </p>
        <div class="hero-actions mt-lg">
          <router-link to="/explore" class="btn btn-primary btn-lg">Explore Projects</router-link>
          <router-link to="/create" class="btn btn-outline btn-lg">Start a Campaign</router-link>
        </div>
      </div>
    </section>

    <!-- Seamless Stats Ticker -->
    <div class="ticker-wrap">
      <div class="ticker-track">
        <span class="ticker-item" v-for="n in 6" :key="n">
          <span class="tick"><b>2.5M+</b> ETH Volume</span>
          <span class="tick-dot">·</span>
          <span class="tick"><b>150+</b> Projects Funded</span>
          <span class="tick-dot">·</span>
          <span class="tick"><b>5.2K</b> Active Backers</span>
          <span class="tick-dot">·</span>
          <span class="tick text-success"><b>100%</b> On-chain</span>
          <span class="tick-dot">·</span>
        </span>
      </div>
    </div>

    <!-- How It Works — Timeline -->
    <section class="timeline-section">
      <div class="container">
        <div class="section-header text-center">
          <h2>How It Works</h2>
          <p>From idea to funding in four simple steps.</p>
        </div>

        <div class="timeline">
          <div class="timeline-line"></div>

          <div class="tl-item">
            <div class="tl-dot">1</div>
            <div class="tl-card glass-card">
              <h4>Create Your Campaign</h4>
              <p class="text-secondary text-sm mt-sm">
                Define your project, set a funding target in ETH, and break it down into milestones for transparent fund release.
              </p>
            </div>
          </div>

          <div class="tl-item tl-right">
            <div class="tl-dot">2</div>
            <div class="tl-card glass-card">
              <h4>Get Funded by the Community</h4>
              <p class="text-secondary text-sm mt-sm">
                Backers contribute ETH directly to your smart contract. Funds are secured on-chain — no intermediary holds your money.
              </p>
            </div>
          </div>

          <div class="tl-item">
            <div class="tl-dot">3</div>
            <div class="tl-card glass-card">
              <h4>Submit Milestones & Get Votes</h4>
              <p class="text-secondary text-sm mt-sm">
                As you deliver results, submit milestone progress. Backers vote to approve fund releases step by step.
              </p>
            </div>
          </div>

          <div class="tl-item tl-right">
            <div class="tl-dot">4</div>
            <div class="tl-card glass-card">
              <h4>Withdraw or Refund</h4>
              <p class="text-secondary text-sm mt-sm">
                Creators withdraw on milestone approval. If a project fails, backers can reclaim their remaining funds instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="testimonials-section">
      <div class="container">
        <div class="section-header">
          <h2>Community Voices</h2>
          <p>Trusted by builders and backers worldwide.</p>
        </div>

        <div class="grid grid-2 mt-xl">
          <div class="testimonial-card glass-card-static">
            <p class="quote">"DecentraFund solved the biggest problem in crowdfunding: trust. Knowing my funds are locked until milestones are met gives me the confidence to support ambitious projects."</p>
            <div class="author mt-md">
              <div class="author-avatar" style="background: linear-gradient(135deg, #6366f1, #06b6d4);"></div>
              <div>
                <p class="font-bold text-sm">Alex Chen</p>
                <p class="text-muted text-sm">Web3 Investor</p>
              </div>
            </div>
          </div>
          <div class="testimonial-card glass-card-static">
            <p class="quote">"Launching our hardware project was seamless. The milestone voting system kept us accountable and maintained a great relationship with our supporters."</p>
            <div class="author mt-md">
              <div class="author-avatar" style="background: linear-gradient(135deg, #f59e0b, #ef4444);"></div>
              <div>
                <p class="font-bold text-sm">Sarah Jenkins</p>
                <p class="text-muted text-sm">Founder, GreenTech Solar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Campaigns -->
    <section class="featured-section">
      <div class="container">
        <div class="section-header flex justify-between items-center">
          <div>
            <h2>Featured Projects</h2>
          </div>
          <router-link to="/explore" class="btn btn-outline btn-sm">View all</router-link>
        </div>
        <div class="grid grid-3">
          <CampaignCard v-for="campaign in demoCampaigns" :key="campaign.id" :campaign="campaign" />
        </div>
      </div>
    </section>

    <!-- Powered By -->
    <section class="powered-section">
      <div class="container text-center">
        <p class="powered-label">Supported By</p>
        <div class="logos-row">
          <!-- Ethereum -->
          <div class="logo-item" title="Ethereum">
            <svg viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fill="#94a3b8"/><path d="M127.962 0L0 212.32l127.962 75.639V154.158z" fill="#cbd5e1"/><path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" fill="#94a3b8"/><path d="M127.962 416.905V312.187L0 236.587z" fill="#cbd5e1"/></svg>
            <span>Ethereum</span>
          </div>
          <!-- Solidity -->
          <div class="logo-item" title="Solidity">
            <svg viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg"><path d="M349.1 81.3L281.3 199h135.6l-67.8-117.7z" fill="#94a3b8" opacity="0.6"/><path d="M281.3 199h135.6L349.1 316.7z" fill="#94a3b8" opacity="0.4"/><path d="M170.9 438.7l67.8-117.7H103.1l67.8 117.7z" fill="#94a3b8" opacity="0.6"/><path d="M238.7 321h-135.6l67.8-117.7z" fill="#94a3b8" opacity="0.4"/></svg>
            <span>Solidity</span>
          </div>
          <!-- IPFS -->
          <div class="logo-item" title="IPFS">
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M235 27l-196 113v226l196 113 196-113V140z" stroke="#94a3b8" fill="none" stroke-width="24"/><circle cx="235" cy="27" r="18" fill="#94a3b8"/><circle cx="39" cy="140" r="18" fill="#94a3b8"/><circle cx="431" cy="140" r="18" fill="#94a3b8"/><circle cx="39" cy="366" r="18" fill="#94a3b8"/><circle cx="431" cy="366" r="18" fill="#94a3b8"/><circle cx="235" cy="479" r="18" fill="#94a3b8"/></svg>
            <span>IPFS</span>
          </div>
          <!-- Vue -->
          <div class="logo-item" title="Vue.js">
            <svg viewBox="0 0 261.76 226.69" xmlns="http://www.w3.org/2000/svg"><path d="M161.096.001l-30.225 52.351L100.647.001H0l130.877 226.688L261.749 0z" fill="#94a3b8" opacity="0.4"/><path d="M161.096.001l-30.225 52.351L100.647.001H52.346l78.526 136.01L209.398.001z" fill="#94a3b8"/></svg>
            <span>Vue 3</span>
          </div>
          <!-- Hardhat -->
          <div class="logo-item" title="Hardhat">
            <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><rect x="22" y="60" width="84" height="12" rx="3" fill="#94a3b8"/><path d="M30 60c0-28 16-40 34-40s34 12 34 40" stroke="#94a3b8" stroke-width="10" fill="none" stroke-linecap="round"/><rect x="18" y="72" width="92" height="14" rx="4" fill="#94a3b8" opacity="0.5"/><rect x="38" y="86" width="52" height="16" rx="4" fill="#94a3b8" opacity="0.3"/></svg>
            <span>Hardhat</span>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-card glass-card-static text-center">
          <h2>Start Building Today</h2>
          <p class="text-secondary mt-sm mb-lg" style="max-width: 520px; margin-inline: auto;">
            Whether you have an idea that needs funding or you want to support the next big thing — you belong here.
          </p>
          <router-link to="/create" class="btn btn-primary">Launch a Campaign</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import CampaignCard from '@/components/CampaignCard.vue'

const demoCampaigns = [
  {
    id: '1', contractAddress: '0x001',
    title: 'GreenTech Solar Initiative',
    description: 'Building affordable solar-powered devices for off-grid communities in Southeast Asia.',
    shortDesc: 'Affordable solar-powered devices for off-grid communities.',
    category: 'Technology', status: 'ACTIVE',
    targetAmount: '10000000000000000000', currentAmount: '7300000000000000000',
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    totalBackers: 42, imageUrl: null,
  },
  {
    id: '2', contractAddress: '0x002',
    title: 'DeFi Education Platform',
    description: 'Free educational platform teaching blockchain and DeFi concepts to students worldwide.',
    shortDesc: 'Teaching blockchain concepts to students worldwide.',
    category: 'Education', status: 'ACTIVE',
    targetAmount: '5000000000000000000', currentAmount: '3200000000000000000',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    totalBackers: 28, imageUrl: null,
  },
  {
    id: '3', contractAddress: '0x003',
    title: 'Web3 Gaming DAO',
    description: 'Community-governed gaming platform where players own their in-game assets as NFTs.',
    shortDesc: 'Community gaming with true asset ownership.',
    category: 'Gaming', status: 'SUCCESSFUL',
    targetAmount: '15000000000000000000', currentAmount: '15000000000000000000',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalBackers: 87, imageUrl: null,
  },
]
</script>

<style scoped>
/* ---- Hero ---- */
.hero {
  position: relative;
  padding: 8rem 0 4rem;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%);
  pointer-events: none;
}

.hero-container {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.03em;
  margin-bottom: 1.25rem;
}

.hero-desc {
  font-size: 1.125rem;
  line-height: 1.6;
  max-width: 560px;
  margin: 0 auto;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

/* ---- Seamless Stats Ticker ---- */
.ticker-wrap {
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  overflow: hidden;
  white-space: nowrap;
}

.ticker-track {
  display: inline-flex;
  animation: scroll-ticker 30s linear infinite;
}

@keyframes scroll-ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

.tick {
  padding: 0.875rem 0.75rem;
  font-size: 0.9375rem;
  color: var(--text-secondary);
}

.tick b {
  color: var(--text-primary);
  font-weight: 600;
}

.tick-dot {
  color: var(--border-light);
  padding: 0 0.5rem;
  font-size: 1.25rem;
}

/* ---- Timeline ---- */
.timeline-section {
  padding: 6rem 0;
}

.timeline {
  position: relative;
  max-width: 700px;
  margin: 3rem auto 0;
}

.timeline-line {
  position: absolute;
  left: 28px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--primary), var(--accent, #0ea5e9), var(--success));
  opacity: 0.3;
}

.tl-item {
  position: relative;
  padding-left: 72px;
  padding-bottom: 2.5rem;
}

.tl-item:last-child {
  padding-bottom: 0;
}

.tl-dot {
  position: absolute;
  left: 14px;
  top: 1rem;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 2px solid var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary-light);
  z-index: 2;
}

.tl-card {
  padding: 1.5rem;
}

/* ---- Testimonials ---- */
.testimonials-section {
  padding: 5rem 0;
}

.testimonial-card {
  padding: 1.75rem;
}

.quote {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--text-secondary);
  font-style: italic;
}

.author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ---- Featured ---- */
.featured-section {
  padding: 5rem 0;
}

/* ---- Powered By ---- */
.powered-section {
  padding: 4rem 0;
  border-top: 1px solid var(--border-color);
}

.powered-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.logos-row {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 3rem;
}

.logo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.5;
  transition: opacity var(--transition-fast);
}

.logo-item:hover {
  opacity: 1;
}

.logo-item svg {
  width: 36px;
  height: 36px;
}

.logo-item span {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* ---- CTA ---- */
.cta-section {
  padding: 3rem 0 5rem;
}

.cta-card {
  padding: 3.5rem 2rem;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .hero-title { font-size: 2.25rem; }
  .hero-actions { flex-direction: column; align-items: center; }
  .timeline-line { left: 18px; }
  .tl-item { padding-left: 52px; }
  .tl-dot { left: 4px; width: 28px; height: 28px; }
}
</style>
