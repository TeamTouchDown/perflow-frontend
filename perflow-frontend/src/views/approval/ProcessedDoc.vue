<script setup>

import {onMounted, ref} from "vue";
import api from "@/config/axios.js";
import router from "@/router/router.js";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import TableCheck from "@/components/common/TableCheck.vue";
import PagingBar from "@/components/common/PagingBar.vue";
import dayjs from "dayjs";
import Tooltip from "@/components/common/ToolTip.vue";
import Alert from "@/components/common/Alert.vue";

const columns = [
  {label: "상태", field: "status"},
  {label: "제목", field: "title"},
  {label: "작성자", field: "createUserName"},
  {label: "작성일", field: "createDatetime"},
  {label: "처리일", field: "processDatetime"},
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

// 툴팁
const tooltipVisible = ref(false);
const tooltipText = "처리 문서란? \n" +
    "내가 이미 결재한 문서"
const tooltipWidth = "200px";

// 처리 문서 목록 조회
const fetchProcessedDocs = async (page = 1) => {
  try {
    const response = (await api.get("approval/processed-docs", {
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
    router.push({ name: "basicDetail", query: { docId: row.docId, type: "processed", approveSbjStatus: row.approveSbjStatus, processDatetime: row.processDatetime, comment: row.comment, status: row.status } });
  } else if (templateId === 5) {
    router.push({ name: "disbursementDetail", query: {docId: row.docId, type: "processed", approveSbjStatus: row.approveSbjStatus, processDatetime: row.processDatetime, comment: row.comment, status: row.status } })
  } else if (templateId === 6) {
    router.push({ name: "workReportDetail", query: {docId: row.docId, type: "processed", approveSbjStatus: row.approveSbjStatus, processDatetime: row.processDatetime, comment: row.comment, status: row.status } })
    // 업무 보고서
  } else {
    showAlert("올바르지 않은 서식입니다.");
  }
};

// 검색 조건 변경 처리
const handleSearch = () => {
  console.log("검색 조건: ", searchCriteria.value);
  currentPage.value = 1;  // 검색 시 페이지를 처음으로 초기화
  fetchProcessedDocsWithCriteria();
};

// 날짜 형식 변경
const formatDate = (date) => {
  return date ? dayjs(date).format("YYYY-MM-DD") : null;
}

// 검색하기
const fetchProcessedDocsWithCriteria = async(page = 1) => {

  const formattedCriteria = {
    ...searchCriteria.value,
    fromDate : formatDate(searchCriteria.value.fromDate),
    toDate: formatDate(searchCriteria.value.toDate),
  };

  try {
    const response = await api.get("approval/processed-docs/search", {
      params: {
        ...formattedCriteria,
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

const alertVisible = ref(false);
const alertMsg = ref('');
const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
}

onMounted(() => {
  fetchProcessedDocs();
})
</script>

<template>

  <Alert
      v-model="alertVisible"
      :message="alertMsg"
  />

  <!-- 헤더 -->
  <div id="header-div">
    <div id="header-top" class="flex-between">
      <div class="tooltip-container">
        <p id="title">처리 문서</p>
        <!-- 툴팁 -->
        <img
            src="@/assets/icons/tooltip.png"
            alt="툴팁"
            class="tooltip-icon"
            @mouseenter="tooltipVisible = true"
            @mouseleave="tooltipVisible = false"
        />
        <Tooltip
            :text="tooltipText"
            :visible="tooltipVisible"
            :width="tooltipWidth"
            :position="{ bottom: '10px', left: '35%' }"
        />
      </div>
    </div>
    <div id="header-bottom" class="flex-between">
      <div id="search-container">
        <!-- 검색 필드 -->
        <div class="conditions">
          <div class="condition-row">
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
          </div>
          <div class="condition-row">
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
      </div>
    </div>
  </div>

  <div id="inbox-doc-container">
    <!-- 테이블 -->
    <div id="inbox-doc-list">
      <TableCheck
          row-key="docId"
          :rows="processedDocs"
          :columns="columns"
          :columnWidths="columnWidths"
      >
        <template #status = "{ row }">
          <span
              class="status-tag"
            :class="{
              'approved': row.approveSbjStatus ==='APPROVED',
              'rejected': row.approveSbjStatus === 'REJECTED',
              'unknown': !['APPROVED', 'REJECTED'].includes(row.approveSbjStatus),
            }"
          >
            {{ row.approveSbjStatus === "APPROVED" ? "승인" : row.approveSbjStatus === "REJECTED" ? "반려" : "알 수 없음" }}
          </span>
        </template>
        <template #title="{ row }">
          <span
              class="clickable-title"
              @click.stop="handleTitleClick(row)"
          >
            {{ row.title }}
          </span>
        </template>
        <!-- 날짜 포맷팅 커스터마이징 -->
        <template #createDatetime="{ value }">
          {{ new Date(value).toLocaleString() }}
        </template>
        <template #processDatetime="{ value }">
          {{ new Date(value).toLocaleString() }}
        </template>
      </TableCheck>
      <PagingBar
          :currentPage="currentPage"
          :totalPages="totalPages"
          :totalItems="totalItems"
          :pageSize="pageSize"
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
#inbox-doc-container {
  display: flex;
  flex-direction: column; /* 테이블과 버튼을 세로로 배치 */
  gap: 10px; /* 테이블과 버튼 간 간격 */
  width: 900px; /* 테이블과 버튼이 같은 폭 */
  margin: 0 auto; /* 중앙 정렬 */
}
#inbox-doc-list {
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
  /* 제목이 길어지면 ... 로 표시 */
  display: inline-block;
  max-width: 100%; /* 부모 요소의 너비를 기준으로 조정 */
  white-space: nowrap; /* 텍스트를 한 줄로 표시 */
  overflow: hidden; /* 넘치는 텍스트를 숨김 */
  text-overflow: ellipsis; /* 넘치는 텍스트에 ... 표시 */
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
  flex-direction: column;
  gap: 10px;  /* 필드 간 간격 */
  width: 100%
}

.condition-row {
  display: flex;
  gap: 10px;
  margin-left: 50px;
}

.button {
  display: flex;
  justify-content: flex-end;
  width: 100% /* 오른쪽 끝에 검색*/
}

.status-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  text-align: center;
  min-width: 50px;
}
/* 승인 */
.status-tag.approved {
  color: #28a745; /* 초록색 */
  border: 1px solid #28a745;
}

/* 반려 */
.status-tag.rejected {
  color: #ff8c00;
  border: 1px solid #ff8c00;
}

/* 알 수 없음 */
.status-tag.unknown {
  color: #007bff; /* 회색 */
  border: 1px solid #007bff; /* 회색 */
}

/* 툴팁 */
.tooltip-container {
  display: flex;
  align-items: center;
  position: relative;
}

.tooltip-basic {
  white-space: pre-line;  /* 툴팁 내용 줄바꿈 허용 */
}

.tooltip-icon {
  width: 50px;
  height: 50px;
  cursor: pointer;
  margin-bottom: 15px;  /* 수신함 글씨와 툴팁 아이콘 정렬 위해 */
}

.Tooltip {
  pointer-events: none;
}
</style>