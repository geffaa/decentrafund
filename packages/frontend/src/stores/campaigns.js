import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const useCampaignStore = defineStore('campaigns', () => {
    const campaigns = ref([])
    const currentCampaign = ref(null)
    const pagination = ref({ page: 1, limit: 12, total: 0, pages: 0 })
    const isLoading = ref(false)
    const error = ref(null)
    const categories = ref([])

    async function fetchCampaigns(params = {}) {
        try {
            isLoading.value = true
            error.value = null

            const { data } = await axios.get(`${API_URL}/campaigns`, { params })
            campaigns.value = data.campaigns
            pagination.value = data.pagination
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to fetch campaigns'
            console.error('fetchCampaigns error:', err)
        } finally {
            isLoading.value = false
        }
    }

    async function fetchCampaignById(id) {
        try {
            isLoading.value = true
            error.value = null

            const { data } = await axios.get(`${API_URL}/campaigns/${id}`)
            currentCampaign.value = data.campaign
            return data.campaign
        } catch (err) {
            error.value = err.response?.data?.error || 'Campaign not found'
            return null
        } finally {
            isLoading.value = false
        }
    }

    async function createCampaign(campaignData) {
        try {
            isLoading.value = true
            error.value = null

            const { data } = await axios.post(`${API_URL}/campaigns`, campaignData)
            return data.campaign
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to create campaign'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function fetchCategories() {
        try {
            const { data } = await axios.get(`${API_URL}/campaigns/categories`)
            categories.value = data.stats
        } catch (err) {
            console.error('fetchCategories error:', err)
        }
    }

    async function uploadToIPFS(file) {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const { data } = await axios.post(`${API_URL}/ipfs/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            return data
        } catch (err) {
            throw new Error('Failed to upload to IPFS')
        }
    }

    return {
        campaigns, currentCampaign, pagination, isLoading, error, categories,
        fetchCampaigns, fetchCampaignById, createCampaign, fetchCategories, uploadToIPFS,
    }
})
