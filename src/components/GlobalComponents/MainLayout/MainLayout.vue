<script setup></script>
<template>
  <div class="min-h-screen flex flex-col">
    <div class="bg-blue-700 px-8 flex items-center justify-between py-4 shadow-sm text-white">
      <NavHeader />
    </div>
    <div class="relative flex flex-grow">
      <nav class="bg-white shadow-sm p-6 min-w-fit"><NavSide /></nav>
      <main class="bg-gray-100 flex-1 p-6">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>
