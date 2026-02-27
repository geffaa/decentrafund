import { defineStore } from 'pinia'
import { ref, shallowRef, computed, markRaw } from 'vue'
import { ethers } from 'ethers'

// Contract ABIs (JSON format for ethers.js v6 compatibility)
const FACTORY_ABI = [
    {
        inputs: [
            { name: '_title', type: 'string' },
            { name: '_description', type: 'string' },
            { name: '_imageHash', type: 'string' },
            { name: '_category', type: 'string' },
            { name: '_targetAmount', type: 'uint256' },
            { name: '_durationDays', type: 'uint256' },
            { name: '_milestoneDescriptions', type: 'string[]' },
            { name: '_milestoneAmounts', type: 'uint256[]' },
        ],
        name: 'createCampaign',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    'function getDeployedCampaigns() external view returns (address[])',
    'function getCampaignsByCreator(address) external view returns (address[])',
    'function getCampaignCount() external view returns (uint256)',
    'event CampaignCreated(address indexed campaignAddress, address indexed creator, string title, uint256 targetAmount, uint256 deadline, string category, uint256 timestamp)',
]

const CAMPAIGN_ABI = [
    'function contribute() external payable',
    'function submitMilestone() external',
    'function voteMilestone(bool) external',
    'function finalizeMilestone() external',
    'function requestRefund() external',
    'function cancelCampaign() external',
    'function getCampaignInfo() external view returns (tuple(address creator, string title, string description, string imageHash, uint256 targetAmount, uint256 currentAmount, uint256 deadline, uint256 createdAt, uint8 status, uint256 totalMilestones, uint256 currentMilestone, uint256 totalBackers, string category))',
    'function getMilestones() external view returns (tuple(string description, uint256 amount, uint8 status, uint256 votesFor, uint256 votesAgainst, uint256 votingDeadline, bool fundsReleased)[])',
    'function contributions(address) external view returns (uint256)',
    'function getBackers() external view returns (address[])',
    'function getContractBalance() external view returns (uint256)',
    'event ContributionMade(address indexed backer, uint256 amount, uint256 timestamp)',
    'event MilestoneSubmitted(uint256 indexed milestoneIndex, string description)',
    'event MilestoneApproved(uint256 indexed milestoneIndex, uint256 amount)',
]

export const useWeb3Store = defineStore('web3', () => {
    // State
    const account = ref(null)
    const chainId = ref(null)
    const provider = shallowRef(null)
    const signer = shallowRef(null)
    const isConnecting = ref(false)
    const error = ref(null)

    const SEPOLIA_CHAIN_ID = '0xaa36a7' // 11155111
    const FACTORY_ADDRESS = import.meta.env.VITE_CONTRACT_FACTORY_ADDRESS || ''

    // Getters
    const isConnected = computed(() => !!account.value)
    const shortAddress = computed(() => {
        if (!account.value) return ''
        return `${account.value.slice(0, 6)}...${account.value.slice(-4)}`
    })
    const isCorrectNetwork = computed(() => chainId.value === SEPOLIA_CHAIN_ID)

    // Actions
    async function connectWallet() {
        if (!window.ethereum) {
            error.value = 'MetaMask not detected. Please install MetaMask.'
            return false
        }

        try {
            isConnecting.value = true
            error.value = null
            localStorage.removeItem('decentrafund_disconnected')

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            })

            const browserProvider = new ethers.BrowserProvider(window.ethereum)
            const userSigner = await browserProvider.getSigner()
            const network = await browserProvider.getNetwork()

            account.value = accounts[0]
            chainId.value = '0x' + network.chainId.toString(16)
            provider.value = markRaw(browserProvider)
            signer.value = markRaw(userSigner)

            // Setup listeners
            window.ethereum.on('accountsChanged', handleAccountsChanged)
            window.ethereum.on('chainChanged', handleChainChanged)

            // Switch to Sepolia if needed
            if (!isCorrectNetwork.value) {
                await switchToSepolia()
            }

            return true
        } catch (err) {
            error.value = err.message
            return false
        } finally {
            isConnecting.value = false
        }
    }

    function disconnectWallet() {
        account.value = null
        chainId.value = null
        provider.value = null
        signer.value = null
        localStorage.setItem('decentrafund_disconnected', 'true')

        if (window.ethereum) {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
            window.ethereum.removeListener('chainChanged', handleChainChanged)
        }
    }

    async function switchToSepolia() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: SEPOLIA_CHAIN_ID }],
            })
        } catch (err) {
            if (err.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: SEPOLIA_CHAIN_ID,
                        chainName: 'Sepolia Testnet',
                        nativeCurrency: { name: 'SepoliaETH', symbol: 'SEP', decimals: 18 },
                        rpcUrls: [import.meta.env.VITE_ALCHEMY_API_URL || 'https://rpc.sepolia.org'],
                        blockExplorerUrls: ['https://sepolia.etherscan.io'],
                    }],
                })
            }
        }
    }

    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            disconnectWallet()
        } else {
            account.value = accounts[0]
        }
    }

    function handleChainChanged(newChainId) {
        chainId.value = newChainId
        window.location.reload()
    }

    // Contract Interaction Helpers
    function getFactoryContract() {
        if (!signer.value || !FACTORY_ADDRESS) return null
        return new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer.value)
    }

    function getCampaignContract(address) {
        if (!signer.value) return null
        return new ethers.Contract(address, CAMPAIGN_ABI, signer.value)
    }

    function getReadOnlyProvider() {
        const alchemyUrl = import.meta.env.VITE_ALCHEMY_API_URL
        if (alchemyUrl) {
            return new ethers.JsonRpcProvider(alchemyUrl)
        }
        return provider.value
    }

    function getCampaignReadOnly(address) {
        const readProvider = getReadOnlyProvider()
        if (!readProvider) return null
        return new ethers.Contract(address, CAMPAIGN_ABI, readProvider)
    }

    // Auto-connect on page load
    async function autoConnect() {
        if (window.ethereum && !localStorage.getItem('decentrafund_disconnected')) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts.length > 0) {
                await connectWallet()
            }
        }
    }

    return {
        // State
        account, chainId, provider, signer, isConnecting, error,
        // Getters
        isConnected, shortAddress, isCorrectNetwork,
        // Actions
        connectWallet, disconnectWallet, switchToSepolia, autoConnect,
        getFactoryContract, getCampaignContract, getCampaignReadOnly,
        // Constants
        FACTORY_ADDRESS,
    }
})
