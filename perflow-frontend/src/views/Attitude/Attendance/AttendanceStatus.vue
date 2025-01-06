<script setup>

import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import {onMounted, ref} from "vue";
import api from "@/config/axios.js";
import router from "@/router/router.js";
import TableBasic from "@/components/common/TableBasic.vue";
import PagingBar from "@/components/common/PagingBar.vue";

const columns = [
  {label: "신청일", field: "status"},
  {label: "휴가 종류", field: "title"},
  {label: "시작일", field: "createUserName"},
  {label: "종료일", field: "createDatetime"},
  {label: "상태", field: "processDatetime"},
];

const columnWidths = ["80px", "200px", "80px", "150px", "150px"]; // 열 값

const processedDocs = ref([]);  // 문서 목록
const totalPages = ref(0);  // 전체 페이지 수
const totalItems = ref(0); // 전체 아이템 수
const currentPage = ref(1); // 현재 페이지
const pageSize = 10; // 페이지당 문서 수

const searchCriteria = ref({
  title: "",
  createUser: "",
  fromDate: null,
  toDate: null,
});

// 처리 문서 목록 조회
const fetchProcessedDocs = async (page = 1) => {
  try {
    const response = (await api.get("", {
      params: {
        page: page - 1,
        size: pageSize,
      }
    }));
    console.log("처리 문서 조회 결과: ", response.data.content);

    processedDocs.value = response.data.content;
    totalPages.value = response.data.totalPages;
    totalItems.value = response.data.totalElements;
    currentPage.value = response.data.number + 1;
  } catch (error) {
    console.error("처리 문서 목록 조회 실패: ", error);
    processedDocs.value = [];
  }
};

// 특정 열(제목) 클릭 시 상세 페이지로 이동
const handleTitleClick = (row) => {

  const templateId = row.templateId;

  if (templateId === 4) {
    // 기본 서식
    router.push({ name: "basicDetail", query: { docId: row.docId } });
  } else if (templateId === 5) {
    router.push({ name: "disbursementDetail", query: {docId: row.docId } })
  } else if (templateId === 6) {
    router.push({ name: "workReportDetail", query: {docId: row.docId } })
    // 업무 보고서
  } else {
    alert("올바르지 않은 서식입니다.");
  }
};

// 검색 조건 변경 처리
const handleSearch = () => {
  console.log("검색 조건: ", searchCriteria.value);
  currentPage.value = 1;  // 검색 시 페이지를 처음으로 초기화
  fetchProcessedDocsWithCriteria();
};

// 검색하기
const fetchProcessedDocsWithCriteria = async(page = 1) => {
  try {
    const response = await api.get("approval/processed-docs/search", {
      params: {
        ...searchCriteria.value,
        page: page - 1,
        size: pageSize,
      },
    });

    processedDocs.value = response.data.content;
    totalPages.value = response.data.totalPages;
    totalItems.value = response.data.totalElements;
    currentPage.value = response.data.number + 1;

    console.log("검색 결과: ", response.data.content);
  } catch (error) {
    console.error("검색 실패: ", error);
    processedDocs.value = [];
  }
};

onMounted(() => {
  fetchProcessedDocs();
})
</script>

<template>
  <div id="header-div">
    <div id="header-top" class="flex-between">
      <p id="title">출퇴근 관리 </p>
    </div>
    <div id="header-bottom" class="flex-between">
      <div id="search-container">
        <!-- 검색 필드 -->
        <div class="conditions">
          <SearchGroupBar
              v-model ="searchCriteria.title"
              placeholder="제목"
              type="text"
              width="500px"
              height="40px"
          />
          <SearchGroupBar
              v-model ="searchCriteria.createUser"
              placeholder="작성자"
              type="text"
          />
          <SearchGroupBar
              v-model ="searchCriteria.fromDate"
              placeholder="작성일(시작)"
              type="date"
          />
          <SearchGroupBar
              v-model ="searchCriteria.toDate"
              placeholder="작성일(끝)"
              type="date"
          />
        </div>
        <!-- 검색 버튼 -->
        <div class="button">
          <ButtonBasic
              color="orange"
              size="medium"
              label="검색하기"
              @click="handleSearch"
          />
        </div>
      </div>
    </div>

    <div class="table-container">
      <TableBasic
          :row-key="'id'"
          :rows="processedDocs"
          :columns="columns"
          :column-widths="columnWidths"
      />
    </div>

    <!-- 페이징 바 -->
    <div class="paging-bar">
      <PagingBar
          :page-size="pageSize"
          :total-items="totalItems"
          :total-pages="totalPages"
          :current-page="currentPage"
          @page-changed="fetchProcessedDocs"
      />
    </div>
  </div>
</template>

<style scoped>

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
#processed-doc-container {
  display: flex;
  flex-direction: column; /* 테이블과 버튼을 세로로 배치 */
  gap: 10px; /* 테이블과 버튼 간 간격 */
  width: 900px; /* 테이블과 버튼이 같은 폭 */
  margin: 0 auto; /* 중앙 정렬 */
}
#processed-doc-list {
  display: flex;
  flex-direction: column; /* 세로 방향으로 정렬 */
  justify-content: center; /* 세로 중앙 정렬 */
  align-items: center; /* 가로 중앙 정렬 */
  gap: 10px; /* 각 요소 간의 간격 */
  margin: 0 auto; /* 수평 중앙 정렬 */
}

/* 테이블 내 제목 컬럼 */
.clickable-title {
  color: #3C4651;
  cursor: pointer;
}
.clickable-title:hover {
  color: #f37321;
  text-decoration: underline;
}


/* 검색 컨테이너 */
#search-container {
  display: flex;
  flex-wrap: wrap;  /* 줄바꿈 허용 */
  align-items: center;
  justify-content: space-between;
  padding: 10px;  /* 내부 여백 */
  border: 1px solid #AFA9A9;
  border-radius: 10px;
  gap: 0px;
}

.conditions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;  /* 필드 간 간격 */
}

.button {
  display: flex;
  justify-content: flex-end;
  width: 100% /* 오른쪽 끝에 검색*/
}

</style>
페이지 기본 꼴