<script setup>

import {onMounted, ref} from "vue";
import api from "@/config/axios.js";
import TableBasic from "@/components/common/TableBasic.vue"
import PagingBar from "@/components/common/PagingBar.vue";
import ExcelDropDown from "@/components/common/ExcelDropDown.vue";
import router from "@/router/router.js";
import SearchBar from "@/components/common/SearchBar.vue";
import TableMove from "@/components/common/TableMove.vue";

const employees = ref([]);

const selectedMenu = ref('all');

const updateSelectedMenu = (menu) => {
  selectedMenu.value = menu;
  if(menu === "all") {
    fetchEmpList();
  } else {
    fetchInvitedEmpList();
  }
}
// 페이지에 들어갈 변수 목록
const pages = ref({
  pageSize: 0,       // 초기값: 0
  totalItems: 0,     // 초기값: 0
  totalPages: 0,     // 초기값: 0
  currentPage: 0     // 초기값: 0
});

// 사원 목록 조회
const fetchEmpList = async (page) => {

  const response = (await api.get("/employees/lists", {
    params: {
      page: page
    }
  })).data;
  employees.value = response.employeeList;

  pages.value = {
    currentPage: response.currentPage,
    pageSize: response.pageSize,
    totalItems: response.totalItems,
    totalPages: response.totalPages
  };
}
// 사원 목록 조회
const fetchInvitedEmpList = async (page) => {

  const response = (await api.get("/employees/lists/invited", {
    params: {
      page: page
    }
  })).data;

  employees.value = response.employeeList;

  pages.value = {
    currentPage: response.currentPage,
    pageSize: response.pageSize,
    totalItems: response.totalItems,
    totalPages: response.totalPages
  };
}

// 사원 목록 검색
const fetchEmpListByName = async (name) => {
  const response = (await api.get("/employees/lists/search", {
    params: {
      page: 1,
      name: name
    }
  })).data;
  employees.value = response.employeeList;

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
const goToDetail = (empId) => {
  router.push({name:'EmpDetail', params : { empId : empId } });
}

// 버튼 드롭다운에 들어갈 버튼 목록
const menus = [
  { label: '한명등록', icon: '', action: () => goTo('/hr/employees/register') },
  { label: 'CSV등록', icon: '', action: () => goTo('/hr/employees/register/lists') },
];

// 테이블 맨 위 컬럼 값. dto의 필드명과 맞춰야함.
const columns = [
  { field: 'empId',    label: '사번'  },
  { field: 'position', label: '직급'  },
  { field: 'job',      label: '직책'  },
  { field: 'name',     label: '이름'  },
];

onMounted(() => {
  fetchEmpList(1);
});

</script>

<template>
  <div id="header-div">
    <div id="header-top" class="flex-between">
      <p id="title">구성원</p>
      <ExcelDropDown
          button-name="등록하기"
          :menu-items="menus"
      />
    </div>
    <div id="header-bottom" class="flex-between">
      <div class="tabs">
        <span class="tab" :class="{active: selectedMenu==='all'}" @click="updateSelectedMenu('all')">전체</span>
        <span class="tab" :class="{active: selectedMenu==='invited'}" @click="updateSelectedMenu('invited')">추가현황</span>
      </div>
      <SearchBar @search="fetchEmpListByName"
        height="40px" font-size="15px" placeholder="사원 이름을 입력해주세요."
      />
    </div>
  </div>

  <!-- 표 사용 -->
  <div id="empList-div">
    <p id="total">{{pages.totalItems}}명</p>
    <TableMove :row-key="'empId'" :rows="employees" :columns="columns" @row-selected="goToDetail"/>
    <paging-bar :page-size="pages.pageSize"
                :total-items="pages.totalItems"
                :total-pages="pages.totalPages"
                :current-page="pages.currentPage"
                @page-changed="fetchEmpList"
    />
  </div>
</template>

<style scoped>
#empList-div {
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
#header-top, #header-bottom {
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

.tabs {
  display: flex;
  gap: 20px;
  font-size: 20px;
}

.tab {
  cursor: pointer;
  padding: 5px 10px;
}

.active {
  font-weight: bold;
  border-bottom: 2px solid #ff6600;
}
</style>