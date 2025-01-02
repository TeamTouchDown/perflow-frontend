<script setup>
// Props 정의
import { ref } from 'vue';

const props = defineProps({
  buttonName: { type: String, default: '버튼' }, // 버튼 이름 설정
  menuItems: {
    type: Array,
    default: () => [] // 드롭다운 메뉴 항목: { label: '텍스트', icon: '이미지 경로', action: 함수 }
  },
});

const isOpen = ref(false); // 드롭다운 열기/닫기 상태

// 드롭다운 토글 함수
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

// 메뉴 항목 클릭 시 동작
const onMenuItemClick = (action) => {
  if (action && typeof action === 'function') {
    action();
  }
  isOpen.value = false; // 메뉴 닫기
};
</script>

<template>
  <div class="dropdown">
    <!-- 버튼 -->
    <div class="dropdown-button" @click="toggleDropdown">
      {{ buttonName }}
      <img
          v-if="isOpen"
          src="../../assets/image/arrow_up_1.png"
          alt="arrow up"
          class="arrow-icon"
      />
      <img
          v-else
          src="../../assets/image/arrow_down_1.png"
          alt="arrow down"
          class="arrow-icon"
      />
    </div>

    <!-- 드롭다운 메뉴 -->
    <div v-if="isOpen" class="dropdown-menu">
      <div
          v-for="(item, index) in menuItems"
          :key="index"
          class="dropdown-item"
          @click="onMenuItemClick(item.action)"
      >
        <!-- 아이콘이 있으면 출력 -->
        <!-- 아이콘: 스타일 적용 -->
        <img
            v-if="item.icon"
            :src="item.icon.src"
            class="icon-style"
            alt="menu-icon"
        />
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown {
  position: relative;
}

.dropdown-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(to right, #ff9900, #ffcc33);
  color: white;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  width: 160px;
  height: 40px;
}

.arrow-icon {
  width: 25px;
  height: 25px;
  margin-left: 8px;
}

.dropdown-menu {
  display: block;
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ff9900;
  border-radius: 5px;
  z-index: 10;
  width: 160px;
  margin-top: 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  color: #3c4651;
  font-size: 16px;
  font-weight: bold;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.icon-style {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}
</style>
