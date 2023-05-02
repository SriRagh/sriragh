<script setup>
import { loginStore } from '@/stores/login'

// access the `store` variable anywhere in the component
const store = loginStore()
// props
const props = defineProps({
  btnText: {
    type: String,
    default: ''
  },
  btnClass: {
    type: Object,
    default: null
  }
})
// emits
const emit = defineEmits(['btnClickEmit'])

// variables
// let isOpen = $ref(false)

// functions
const btnClickMethod = () => {
  // isOpen = !isOpen
  emit('btnClickEmit')
}
const closeOffCanvas = () => {
  store.updateIsOpenCanvas(false)
}

const isOpenCanvas = computed(() => {
  return store.getters_isOpenCanvas
})

// computed
const btnClasses = computed(() => {
  console.log(props.btnClass.btnBgColor, props.btnClass)
  return `${props.btnClass.btnBgColor}  ${props.btnClass.btnSize} `
})
</script>
<template>
  <button
    :class="btnClasses"
    class="hover:bg-[#1F3D5A] text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
    type="button"
    @click="btnClickMethod()"
  >
    {{ props.btnText }}
  </button>
  <div v-if="isOpenCanvas">
    <OffCanvas @closeOffCanvas="closeOffCanvas" />
  </div>
</template>
