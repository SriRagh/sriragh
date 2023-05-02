<script setup>
// imports from vue //
// imports from store /
//props
//emits
//variables - refs/reactive
//functions
//life cycle hooks
import ForgotPasswordCard from '../Cards/ForgotPasswordCard.vue'
import LoginCard from '../Cards/LoginCard.vue'

// props
const props = defineProps({
  componentName: {
    type: String,
    default: ''
  }
})

// render the card component based on prop value
const dynamicComponentName = computed(() => {
  switch (props.componentName) {
    case 'loginCard':
      return LoginCard
    case 'forgotPassword':
      return ForgotPasswordCard
    default:
      return ''
  }
})
</script>

<template>
  <div class="lg:bg-[url(@/assets/backgroundImage.svg)] bg-bottom bg-no-repeat lg:bg-cover">
    <div
      class="lg:absolute lg:top-10 lg:left-10 md:mx-auto md:w-fit min-[320px]:w-fit min-[320px]:mx-auto"
    >
      <div class="logo">
        <img id="logoSvg" src="@/assets/fl_logo.svg" alt="logo" />
      </div>
    </div>
    <div class="container m-auto">
      <div class="grid lg:grid-cols-2 lg:min-h-screen">
        <!-- lg:col-start-3 col-span-4  col-start-5 min-[320px]:col-start-5 min-[320px]-->
        <div class="lg:flex hidden items-center justify-center md:mb-5">
          <div class="loginImg lg:block">
            <img
              id="loginVector"
              class="m-auto"
              src="@/assets/login_vectorp.png"
              alt="login vector"
            />
          </div>
        </div>
        <!-- lg:col-span-4 lg:col-start-8 md:col-span-12 min-[320px]:col-span-12 -->
        <!--  -->
        <div class="flex lg:items-center">
          <div class="w-full lg:w-3/4 p-12">
            <component :is="dynamicComponentName" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
