<script setup>
import { loginStore } from '@/stores/login'
import router from '../../../router'

const store = loginStore()
const btnClass = reactive({
  btnSize: 'w-96',
  btnBgColor: 'bg-[#0D2B48]'
})
function goToForgotPassword() {
  store.isDefaultComponentName = 'forgotPassword'
}

// emits
// eslint-disable-next-line no-undef
const btnText = ref('Login')

const loginMethod = () => {
  router.push('/account-owner/dashboard')
}
</script>
<template>
  <div class="bg-white border border-slate-200 shadow-md rounded-lg p-12 h-fit">
    <form class="">
      <div>
        <h2 class="text-left text-2xl font-bold tracking-tight text-[#1F3D5A]-900">Login</h2>
        <h6 class="mb-6 mt-2 font-bold text-[#3D6083]">
          New user ?
          <span href="#" class="font-bold text-[#3E8ACC] hover:text-[#3E8ACC] cursor-pointer"
            >Create an account</span
          >
        </h6>
      </div>
      <div class="w-full space-y-5 [&>div>label]:mb-2">
        <div>
          <label for="email" class="block text-sm font-bold text-[#1F3D5A]">Email address</label>
          <input
            class="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label class="block text-[#1F3D5A] text-sm font-bold" for="password"> Password </label>
          <input
            class="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="Input password"
          />
        </div>
        <div class="flex justify-end">
          <span
            @click="goToForgotPassword"
            class="inline-block align-baseline font-bold text-sm text-[#3e8acc] hover:text-[#3e8acc] cursor-pointer"
          >
            Forgot Password?
          </span>
        </div>
        <div class="">
          <ButtonLogin :btnClass="btnClass" :btnText="btnText" @btnClickEmit="loginMethod" />
        </div>
      </div>
    </form>
  </div>
</template>
