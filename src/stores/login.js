import { defineStore } from 'pinia'
export const loginStore = defineStore('login', {
    state: () => ({
        isDefaultComponentName: 'loginCard',
        isOpenCanvas:false
      }),
  getters:{
    getters_isDefaultComponentName : (state) => state.isDefaultComponentName,
    getters_isOpenCanvas : (state) => state.isOpenCanvas
  },
  actions:{
    updateIsOpenCanvas(value){
      this.isOpenCanvas = value
    }
  }
  
})