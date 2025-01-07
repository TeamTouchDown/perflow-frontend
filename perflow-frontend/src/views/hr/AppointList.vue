<script setup>

import {onMounted, ref} from "vue";
import api from "@/config/axios.js";
import TableBasic from "@/components/common/TableBasic.vue"
import PagingBar from "@/components/common/PagingBar.vue";
import router from "@/router/router.js";
import ButtonBasic from "@/components/common/ButtonBasic.vue"
import AppointRegisterSideBar from "@/components/hr/sideBar/AppointRegisterSideBar.vue";

const appoints = ref([]);

// 페이지에 들어갈 변수 목록
const pages = ref({
  pageSize: 0,       // 초기값: 0
  totalItems: 0,     // 초기값: 0
  totalPages: 0,     // 초기값: 0
  currentPage: 0     // 초기값: 0
});



// 사원 목록 조회
const fetchAppointList = async (page) => {

  const typeToKorean = {
    PROMOTION: "승진",
    TRANSFER: "부서이동",
    DEMOTION: "강등", // 추가 예시
    CHANGE_JOB: "직책 변경", // 추가 예시
    // 필요한 유형을 여기에 추가
  };

  const response = (await api.get("/hr/appoint", {
    params: {
      page: page
    }
  })).data;
  // appointResponseList의 type을 한글로 변환
  appoints.value = response.appointResponseList.map(item => ({
    ...item,
    type: typeToKorean[item.type] || "알 수 없음" // 매핑이 없을 경우 기본값
  }));
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
  { field: 'empName',    label: '사원명'  },
  { field: 'type', label: '발령구분'  },
  { field: 'before',      label: '발령전'  },
  { field: 'after',     label: '발령후'  },
  { field: 'appointDate',     label: '발령일'  },
];

const isSidebarOpen = ref(false)

function showSidebar() {
  isSidebarOpen.value = true;
}
function hideSidebar() {
  isSidebarOpen.value = false;
}

onMounted(() => {
  fetchAppointList(1);
});

</script>

<template>
  <AppointRegisterSideBar :isSidebarOpen="isSidebarOpen" @close-sidebar="hideSidebar" title="발령 등록"/>
  <div id="header-div">
    <div id="header-top" class="flex-between">
      <p id="title">발령 관리</p>
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
    <TableBasic :row-key="'id'" :rows="appoints" :columns="columns"/>
    <paging-bar :page-size="pages.pageSize"
                :total-items="pages.totalItems"
                :total-pages="pages.totalPages"
                :current-page="pages.currentPage"
                @page-changed="fetchAppointList"
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