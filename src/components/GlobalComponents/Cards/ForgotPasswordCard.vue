<script setup>
import { loginStore } from '@/stores/login'
const store = loginStore()
function goToLoginPage() {
  store.isDefaultComponentName = 'loginCard'
}
</script>
<template>
  <!-- px-8 pt-6 pb-8 mb-4 -->
  <div class="bg-white border border-slate-200 shadow-md rounded-lg px-[50px] py-[50px] h-fit">
    <form class="">
      <div>
        <h2 class="text-left text-2xl font-bold tracking-tight text-[#1F3D5A]-900">
          Forgot password
        </h2>
        <h6 class="mb-6 mt-2 font-bold text-[#3D6083]">
          Already existing user ?
          <span
            class="font-bold text-[#3E8ACC] hover:text-[#3E8ACC] cursor-pointer"
            @click="goToLoginPage"
            >Login</span
          >
        </h6>
      </div>
      <div class="w-full space-y-5 [&>div>label]:mb-2">
        <div>
          <label for="email" class="block text-sm font-bold text-[#1F3D5A]"
            >Enter email address</label
          >
          <!-- <div class="mt-2"> -->
          <input
            class="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            placeholder="email@example.com"
          />
          <!-- </div> -->
        </div>

        <div class="">
          <button
            class="bg-[#0D2B48] hover:bg-[#1F3D5A] text-white font-bold py-2 px-4 rounded-lg w-full focus:outline-none focus:shadow-outline"
            type="button"
          >
            Forgot password
          </button>
        </div>
      </div>
    </form>
  </div>
  <!-- <div class="loginImg xs:hidden sm:hidden md:hidden lg:block">
    <h1>Login Card</h1>
    <img id="loginVector" class="m-auto" src="@/assets/login_vector.svg" alt="login vector" />
  </div>
  <div>
    <button @click="goToForgotPassword()">Forgot Password</button>
  </div> -->
</template>
