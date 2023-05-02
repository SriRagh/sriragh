<script setup>
import router from '../../router'
// imageImports
import DashboardIcon from '@/assets/SideNavigations/dashboard.svg'
import CasesIcon from '@/assets/SideNavigations/case.svg'
import ClientsIcon from '@/assets/SideNavigations/clients.svg'
// variables
const sideNav = reactive([
  {
    imageSrc: DashboardIcon,
    routerPath: 'dashboard'
  },
  {
    imageSrc: CasesIcon,
    routerPath: 'cases'
  },
  {
    imageSrc: ClientsIcon,
    routerPath: 'clients'
  }
])

// functions methods
const goToRouter = (value) => {
  router.push(`/account-owner/${value}`)
}
</script>
<template>
  <div>
    <ul class="space-y-6" v-for="(eachNav, index) in sideNav" :key="index">
      <li class="cursor-pointer p-5 justify-center" @click="goToRouter(eachNav.routerPath)">
        <img :src="eachNav.imageSrc" alt="" />
      </li>
    </ul>
  </div>
</template>
