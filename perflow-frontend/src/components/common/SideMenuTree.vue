<script setup>

import {computed, onMounted, ref} from "vue";
import {useStore} from "@/store/store.js";
import SideMenuNode from "@/components/common/SideMenuNode.vue"
import homeImg from "@/assets/icons/home.png"
import hrImg from "@/assets/icons/hr.png"
import payImg from "@/assets/icons//pay.png"
import approvalImg from "@/assets/icons/approval.png"
import attitudeImg from "@/assets/icons/attitude.png"
import performanceImg from "@/assets/icons/performance.png"
import notificationImg from "@/assets/icons/notification.png"
import severanceImg from "@/assets/icons/severance_pay.png"

// script setup 안에서
const iconMap = [
    homeImg,
    hrImg,
    payImg,
    approvalImg,
    attitudeImg,
    performanceImg,
    notificationImg,
    severanceImg
];

const store = useStore();

const initial = computed(() => {
  const name = store.$state.company.name || ''
  return name.substring(0, 2)
})
const bgColor = ref(getRandomColor());

// 랜덤 색상 생성 함수 (단순 예제)
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

onMounted(async () => {
  await store.fetchMenu(); // Pinia를 통해 데이터를 가져옵니다.
  await store.fetchCompany();
});

</script>

<template>
  <div id="side-menu">

    <div id="side-menu-top">
      <div
          class="company-icon"
          :style="{ backgroundColor: bgColor }"
      >
        {{ initial }}
      </div>
      {{ store.$state.company.name }}
    </div>
    <ul class="side-menu-tree">
      <!--    자식 컴포넌트 (재귀로 계속해서 호출) -->
        <SideMenuNode
            v-for="(menu,index) in store.$state.allMenu.filter(menu => !menu.parentId)"
            :key=menu.menuId
            :parent = menu
            :icon="iconMap[index]"
        />
    </ul>
  </div>
</template>

<style scoped>
.side-menu-tree {
  list-style: none;
  padding: 0;
}
#side-menu-top{
  height: 80px;
  border-bottom: 1px solid #817F7F;
  display: flex;
  align-items: center;
  padding: 40px;
  font-weight: bold;
  margin-bottom: 10px;
}
#side-menu {
  width: 280px;
  height: 100%;
  font-size: 17px;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
  position: absolute;
  background-color: white;
}
.company-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;       /* 정사각형 크기 */
  height: 40px;
  color: #fff;       /* 텍스트 색상 */
  font-weight: bold; /* 문자 강조 */
  border-radius: 4px;/* 모서리를 약간 둥글게 */
  margin-right: 20px; /* 아이콘과 회사명 사이 간격 */
}
</style>