<script setup>
import { loginStore } from '@/stores/login'

// access the `store` variable anywhere in the component
const store = loginStore()
const createCaseBtn = ref('Create Dashboard')
// const btnSize = ref('w-40')
const btnClass = reactive({
  btnSize: 'w-96',
  btnBgColor: 'bg-[#0D2B48]'
})
// let isOpenCanvas = $ref(false)

// functions
const btnClickedMethod = () => {
  store.updateIsOpenCanvas(true)
}
</script>
<template>
  <div>
    <h1>Dashboard</h1>
    <ButtonLogin :btnText="createCaseBtn" :btnClass="btnClass" @btnClickEmit="btnClickedMethod" />
  </div>
</template>
