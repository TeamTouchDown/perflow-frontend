<script setup>

import {useStore} from "@/store/store.js";
import { useRouter } from 'vue-router'
import {computed, ref} from "vue";
import {useAuthStore} from "@/store/authStore.js";
import Alert from "@/components/common/Alert.vue";
const authStore = useAuthStore();
const store = useStore();
const router = useRouter();
const modalVisible = ref(false);

const updateModalVisible = (value) => {
  modalVisible.value = value;
}

const authorities = computed(()=> {
  return authStore.authorities;
})

const goTo = (url, authorityId) => {

  if(authorities.value.includes(authorityId)||authorities.value.includes(4)){
    router.push(url);
  } else {
    updateModalVisible(true);
  }

}
// 하위 메뉴 표시 상태 관리
const isExpanded = ref(false);

// 하위 메뉴 존재 여부 파악
const hasChildren = computed(() => {
  return store.$state.allMenu.some(menu => menu.parentId === props.parent.id);
});

// 토글 함수
const toggle = () => {
  isExpanded.value = !isExpanded.value;
};

// Props로 메뉴 데이터 전달
const props = defineProps({
  parent : Object,
  icon: String
});

</script>

<template>
  <li class="menu-list">
    <!-- 현재 메뉴 이름 출력 -->
    <div class="menu-header">
      <Alert :model-value=modalVisible message="권한이 없습니다." @update:modelValue="updateModalVisible"/>
      <img v-if="icon" :src="icon" class="menu-icon" alt="icon" />
      <span class="menu-name" @click="goTo(props.parent.url, props.parent.authorityId)">{{ props.parent.name }}</span>
      <span v-if="hasChildren" class="arrow" :class="{ expanded: isExpanded }" @click="toggle">▼</span>
    </div>
  </li>
  <!-- 하위 부서 렌더링 -->
  <ul v-if="isExpanded" class="menu-child">
    <SideMenuNode
        v-for="child in store.$state.allMenu.filter(menu => menu.parentId === props.parent.id)"
        :key="child.menuId"
        :parent="child"
    />
  </ul>
</template>

<style scoped>
.menu-child {
  list-style: none;
}
.menu-list {
  padding-left: 20px;
  padding-top: 10px;
  padding-bottom: 10px;
  background-color: white;
}
.menu-name {
  width: 180px;
  cursor: pointer;
}
.menu-header {
  display: flex;
  align-items: center;
}
.menu-list:hover {
  background-color: #F7F7F7;
}
.arrow {
  transition: transform 0.2s ease;
  font-size: 12px;
  cursor: pointer;
  color: #AFA9A9;
}
/* 토글 상태에 따른 화살표 회전 */
.arrow.expanded {
  transform: rotate(180deg);
}
.menu-icon {
  margin-right: 20px;
}
</style>