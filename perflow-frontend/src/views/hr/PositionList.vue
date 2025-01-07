<script setup>

import {onMounted, ref} from "vue";
import api from "@/config/axios.js";
import TableBasic from "@/components/common/TableBasic.vue"
import PagingBar from "@/components/common/PagingBar.vue";
import router from "@/router/router.js";
import ButtonBasic from "@/components/common/ButtonBasic.vue"
import PositionRegisterSideBar from "@/components/hr/sideBar/PositionRegisterSideBar.vue";
import PositionModifySideBar from "@/components/hr/sideBar/PositionModifySideBar.vue";
import TableMove from "@/components/common/TableMove.vue";

const positions = ref([]);
const positionId=ref();
// 페이지에 들어갈 변수 목록
const pages = ref({
  pageSize: 0,       // 초기값: 0
  totalItems: 0,     // 초기값: 0
  totalPages: 0,     // 초기값: 0
  currentPage: 0     // 초기값: 0
});

// 사원 목록 조회
const fetchPositionList = async (page) => {

  const response = (await api.get("/position", {
    params: {
      page: page
    }
  })).data;
  positions.value = response.positions;

  pages.value = {
    currentPage: response.currentPage,
    pageSize: response.pageSize,
    totalItems: response.totalItems,
    totalPages: response.totalPages
  };
}

// 라우팅 시 사용
const goTo = (url) => {
  router.push(url);
}

// 테이블 맨 위 컬럼 값. dto의 필드명과 맞춰야함.
const columns = [
  { field: 'positionId',    label: '직위번호'  },
  { field: 'name', label: '직위명'  },
  { field: 'positionLevel',      label: '직위 등급'  }
];

const isSidebarOpen = ref(false)
const isModifySidebarOpen = ref(false)
function showSidebar() {
  isSidebarOpen.value = true;
}
function hideSidebar() {
  isSidebarOpen.value = false;
}
function showModifySidebar(id) {
  positionId.value = id;
  isModifySidebarOpen.value = true;
}
function hideModifySidebar() {
  isModifySidebarOpen.value = false;
}
onMounted(() => {
  fetchPositionList(1);
});

</script>

<template>
  <PositionRegisterSideBar :isSidebarOpen="isSidebarOpen" @close-sidebar="hideSidebar" title="직위 등록"/>
  <PositionModifySideBar :isSidebarOpen="isModifySidebarOpen"
                         @close-sidebar="hideModifySidebar"
                         :positionId="positionId"
                         title="직위 수정"/>
  <div id="header-div">
    <div id="header-top" class="flex-between">
      <p id="title">직위 관리</p>
      <ButtonBasic
          label="등록 하기"
          size="medium"
          @click="showSidebar"
      />
    </div>
  </div>

  <!-- 표 사용 -->
  <div id="jobList-div">
    <p id="total">{{pages.totalItems}}개</p>
    <TableMove :row-key="'positionId'" :rows="positions" :columns="columns" @rowSelected="showModifySidebar"/>
    <paging-bar :page-size="pages.pageSize"
                :total-items="pages.totalItems"
                :total-pages="pages.totalPages"
                :current-page="pages.currentPage"
                @page-changed="fetchPositionList"
    />
  </div>
</template>

<style scoped>
#jobList-div {
  display: flex;
  flex-direction: column; /* 세로 방향으로 정렬 */
  justify-content: center; /* 세로 중앙 정렬 */
  align-items: center; /* 가로 중앙 정렬 */
  gap: 10px; /* 각 요소 간의 간격 */
  margin: 0 auto; /* 수평 중앙 정렬 */
}

#title {
  font-size: 35px;
  font-weight: bold;
  color: #3C4651;
}
#header-div {
  display: flex;
  flex-direction: column; /* 세로 방향으로 정렬 */
  justify-content: center; /* 세로 중앙 정렬 */
  align-items: center; /* 가로 중앙 정렬 */
  margin-top: 50px;
}
#header-top {
  margin-bottom: 10px;
  width: 900px;
}
#total {
  margin: 0;
  padding: 0;
  font-weight: bold;
  color: #3c4651;
  width: 800px;
  text-align: right;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>