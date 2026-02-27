<template>
  <div id="app-root">
    <NavBar />
    <main>
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <FooterSection />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useWeb3Store } from '@/stores/web3'
import NavBar from '@/components/NavBar.vue'
import FooterSection from '@/components/FooterSection.vue'

const web3 = useWeb3Store()

onMounted(() => {
  web3.autoConnect()
})
</script>

<style>
#app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
