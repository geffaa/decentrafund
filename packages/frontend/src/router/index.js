import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomePage.vue'),
    },
    {
        path: '/explore',
        name: 'Explore',
        component: () => import('@/views/ExplorePage.vue'),
    },
    {
        path: '/campaign/:id',
        name: 'CampaignDetail',
        component: () => import('@/views/CampaignDetail.vue'),
        props: true,
    },
    {
        path: '/create',
        name: 'CreateCampaign',
        component: () => import('@/views/CreateCampaign.vue'),
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardPage.vue'),
    },
    {
        path: '/analytics',
        name: 'Analytics',
        component: () => import('@/views/AnalyticsPage.vue'),
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 }
    },
})

export default router
