<template>
  <div class="container m-auto">
    <div class="grid grid-cols-3 gap-4 border-4 w-6/12 bg-gray-50 [&>*]:bg-black">
      <div class="p-5 place-self-start bg-blue-500">01</div>
      <div class="p-5 bg-amber-300 place-self-end text-white text-center">02</div>
      <div class="p-5 place-self-auto text-white text-center">03</div>
      <div class="p-5 text-white text-center">04</div>
      <div class="p-5 text-white text-center">05</div>
      <div class="p-5 text-white text-center">06</div>
    </div>
    <div class="grid grid-rows-2 grid-flow-col gap-4 mt-6">
      <div class="p-5 text-white text-center">01</div>
      <div class="p-5 text-white text-center">02</div>
      <div class="p-5 col-span-2 text-white text-center">03</div>
      <div class="p-5 text-white text-center">04</div>
      <div class="p-5 text-white text-center">05</div>
      <div class="p-5 text-white text-center">06</div>
      <div class="p-5 text-white text-center">07</div>
    </div>
    <div class="grid mt-5">
      <div class="p-5 border-4 border-indigo-500/100 col-span-4 bg-black text-white text-center">
        08
      </div>
    </div>
  </div>
</template>
