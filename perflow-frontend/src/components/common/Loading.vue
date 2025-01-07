<script setup>
import {computed} from "vue";
import {useStore} from "@/store/store.js";

const store = useStore();

const isLoading = computed(() => {
  return store.$state.isLoading
})
</script>

<template>
  <div v-if="isLoading" class="loading">
    <div class="spinner"></div>
  </div>
</template>

<style scoped>
.loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.spinner {
  width: 60px;
  height: 60px;
  border: 8px solid #f3f3f3;
  border-top: 8px solid #f37321;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>