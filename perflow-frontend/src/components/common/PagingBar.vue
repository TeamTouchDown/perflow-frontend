<script setup>
const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    default: '20px'
  },
  imgSize: {
    type: String,
    default: '20px'
  }
});

const emit = defineEmits(["page-changed"]);

// 페이지 이동
const changePage = (page) => {
  if(page >= 1 && page <= props.totalPages) {
    emit("page-changed", page)
  }
};
</script>

<template>
  <div class="paging-bar">
    <button
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
    >
      <img src="../../assets/image/previous.png" alt="previous"
           :style="{ width: props.imgSize, height: props.imgSize }"
      >
    </button>

    <span class="current-page" :style="{ fontSize: props.size }">
      <span :style="{ color: '#3C4651', }">{{ currentPage }}</span> /
      <span :style="{ color: '#817F7F' }">{{ totalPages }}</span>
    </span>

    <button
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
    >
      <img src="../../assets/image/next.png" alt="next"
           :style="{ width: props.imgSize, height: props.imgSize }"
      >
    </button>
  </div>
</template>

<style scoped>
.paging-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.paging-bar button {
  background: none;
  border: none;
  cursor: pointer;
}

.paging-bar button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.current-page {
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

</style>
