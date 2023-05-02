<script setup>
import { loginStore } from '@/stores/login'

// access the `store` variable anywhere in the component
const store = loginStore()

const isCardComponentName = computed(() => {
  return store.getters_isDefaultComponentName
})
</script>

<template>
  <div>
    <DefaultBgScreen :componentName="isCardComponentName" />
  </div>
</template>
