<script setup>
import { onMounted, ref } from "vue";
import api from "@/config/axios.js";
import TableBasic from "@/components/common/TableBasic.vue";
import PagingBar from "@/components/common/PagingBar.vue";
import SearchBar from "@/components/common/SearchBar.vue";
import {useRouter} from "vue-router";

// 공지사항 데이터와 페이지 정보 관리
const announcements = ref([]);
const departments = ref([]);
const pages = ref({
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
});

const router = useRouter(); // Vue Router 사용

const searchKeyword = ref(""); // 검색 키워드 관리
const selectedDept = ref("전체"); // 부서명 필터
const selectedSortOrder = ref("최신순"); // 정렬 기준
let isSearching = ref(false); // 검색 상태 관리

const formatDate = (datetime) => {
  return new Date(datetime).toISOString().split("T")[0];
};

const goToCreatePage = () => {
  router.push("/announcements/create");
};

// 공지사항 리스트 조회
const fetchAnnouncements = async (page = 1) => {
  try {
    const sortOrder =
        selectedSortOrder.value === "최신순" ? "createDatetime,desc" : "createDatetime,asc";

    const response = await api.get("/announcements", {
      params: {
        page: page - 1,
        size: pages.value.pageSize,
        sort: sortOrder,
        deptName: selectedDept.value === "전체" ? null : selectedDept.value,
      },
    });

    const data = response.data;
    announcements.value = data.content.map((item) => ({
      ...item,
      createDatetime: formatDate(item.createDatetime),
    }));

    pages.value = {
      currentPage: data.pageable.pageNumber + 1,
      pageSize: data.pageable.pageSize,
      totalItems: data.totalElements,
      totalPages: data.totalPages,
    };

    isSearching.value = false; // 검색 상태 초기화
  } catch (error) {
    console.error("공지사항 리스트 조회 실패", error);
  }
};

// 검색 API 요청
const fetchSearchResults = async (page = 1) => {
  try {
    const sortOrder =
        selectedSortOrder.value === "최신순" ? "createDatetime,desc" : "createDatetime,asc";

    const response = await api.get("/announcements/search/title", {
      params: {
        title: searchKeyword.value.trim(),
        page: page - 1,
        size: pages.value.pageSize,
        sort: sortOrder,
      },
    });

    const data = response.data;
    announcements.value = data.content.map((item) => ({
      ...item,
      createDatetime: formatDate(item.createDatetime),
    }));

    pages.value = {
      currentPage: data.pageable.pageNumber + 1,
      pageSize: data.pageable.pageSize,
      totalItems: data.totalElements,
      totalPages: data.totalPages,
    };

    isSearching.value = true; // 검색 상태 활성화
  } catch (error) {
    console.error("검색 결과 조회 실패", error);
  }
};

// 검색 실행 시 호출
const handleSearch = (searchText) => {
  const searchValue = (searchText || "").toString().trim();

  if (searchValue) {
    searchKeyword.value = searchValue; // 검색어 저장
    fetchSearchResults(1); // 검색 API 호출
  } else {
    searchKeyword.value = "";
    fetchAnnouncements(1); // 검색어 없으면 전체 조회
  }
};

const handleFilterChange = () => {
  // 필터 변경 시 전체 공지사항 목록 조회
  fetchAnnouncements(1);
};

// 페이지 변경 처리
const handlePageChange = (page) => {
  if (isSearching.value) {
    fetchSearchResults(page);
  } else {
    fetchAnnouncements(page);
  }
};

// 부서 목록 조회
const fetchDepartments = async () => {
  try {
    const response = await api.get("/departments/list");
    departments.value = response.data.map((dept) => dept.name);
  } catch (error) {
    console.error("부서 목록 조회 실패", error);
  }
};

const goToAnnouncementDetail = (annId) => {
  router.push(`/announcements/${annId}`);
};


// 초기 데이터 가져오기
onMounted(() => {
  fetchAnnouncements();
  fetchDepartments();
});

const columns = [
  { field: "title", label: "제목", width: "60%" },
  { field: "deptName", label: "부서명", width: "20%" },
  { field: "createDatetime", label: "작성일", width: "20%" },
];
</script>

<template>
  <div id="announcement-container">
    <div id="header" class="header-aligned">
      <p id="title">공지사항</p>
      <div class="search-bar-container">
        <div class="search-bar-wrapper">
          <!-- 검색 바 -->
          <SearchBar
              @search="handleSearch"
              height="40px"
              font-size="15px"
              placeholder="검색어를 입력하세요."
          />
        </div>
        <div class="filters-wrapper">
          <!-- 드롭다운 변경 시 handleFilterChange 호출 -->
          <select v-model="selectedDept" class="filter-dropdown" @change="handleFilterChange">
            <option value="전체">전체</option>
            <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
          </select>
          <select v-model="selectedSortOrder" class="filter-dropdown" @change="handleFilterChange">
            <option value="최신순">최신순</option>
            <option value="오래된순">오래된순</option>
          </select>
          <button class="write-button" @click="goToCreatePage">글쓰기</button>
        </div>
      </div>
    </div>

    <div id="announcement-list">
      <TableBasic
          :row-key="'annId'"
          :rows="announcements"
          :columns="columns"
      >
        <!-- 제목 열 커스터마이징 -->
        <template #title="{ row }">
    <span
        @click="goToAnnouncementDetail(row.annId)"
        style="color: inherit; cursor: pointer; text-decoration: none;"
        class="clickable-title"
    >
      {{ row.title }}
    </span>
        </template>
      </TableBasic>

      <div class="paging-wrapper">
        <PagingBar
            :page-size="pages.pageSize"
            :total-items="pages.totalItems"
            :total-pages="pages.totalPages"
            :current-page="pages.currentPage"
            @page-changed="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 전체 컨테이너 */
#announcement-container {
  width: 100%; /* 화면 전체에 맞춤 */
  max-width: 900px; /* 표 너비와 일치 */
  margin: 0 auto;
  margin-top: 50px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box; /* 여백 포함 */
}

/* 헤더 영역 */
#header {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%; /* 부모 컨테이너에 맞춤 */
  box-sizing: border-box; /* 패딩 포함 */
}

.header-aligned {
  width: 900px; /* 표 너비와 일치 */
  margin: 0 auto; /* 가운데 정렬 */
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-bar-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.search-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-dropdown {
  height: 40px;
  font-size: 15px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.filters-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.filter-dropdown {
  height: 40px;
  font-size: 15px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

#title {
  font-size: 30px;
  font-weight: bold;
  color: #3c4651;
  margin-bottom: 10px;
}

.clickable-title {
  color: #000; /* 원하는 색상으로 변경 */
  cursor: pointer;
  text-decoration: none;
}

.write-button {
  background: linear-gradient(to right, #ff9900, #ffcc33);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

/* 리스트 영역 */
#announcement-list {
  width: 900px; /* 부모 컨테이너와 동일한 너비 */
  margin: 0 auto;
}

#announcement-list table {
  width: 100%; /* 테이블 너비를 부모(표)에 맞춤 */
  border-collapse: collapse; /* 셀 간격 제거 */
  table-layout: fixed; /* 열 너비 균등 유지 */
}

#announcement-list th,
#announcement-list td {
  text-align: center; /* 텍스트 가운데 정렬 */
  vertical-align: middle; /* 세로 중앙 정렬 */
  font-size: 15px;
  word-wrap: break-word; /* 긴 텍스트 줄바꿈 */
  padding: 10px;
}

#announcement-list th {
  color: #3C4651;
  font-weight: bold;
  background-color: #f4f4f4;
}

#announcement-list td {
  color: #3C4651;
}

#announcement-list tr {
  height: 45px; /* 각 행 높이 고정 */
}

#announcement-list th:first-child,
#announcement-list td:first-child {
  width: 60%; /* 제목 열 비율 */
}

#announcement-list th:nth-child(2),
#announcement-list td:nth-child(2) {
  width: 20%; /* 부서명 열 비율 */
}

#announcement-list th:last-child,
#announcement-list td:last-child {
  width: 20%; /* 작성일 열 비율 */
}

.paging-wrapper {
  display: flex;
  justify-content: center; /* 중앙 정렬 */
  margin-top: 10px;
}
</style>
