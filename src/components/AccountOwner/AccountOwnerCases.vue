<script setup>
const createCaseBtn = ref('Create Case')
const btnClass = reactive({
  btnSize: 'w-80',
  btnBgColor: 'bg-[#0D2B48]'
})
</script>
<template>
  <div>
    <h1>Cases</h1>
    <ButtonLogin :btnText="createCaseBtn" :btnClass="btnClass" />
  </div>
</template>
