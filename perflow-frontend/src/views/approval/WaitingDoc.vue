<script setup>

import ButtonBasic from '@/components/common/ButtonBasic.vue';
import PagingBar from "@/components/common/PagingBar.vue";
import {onMounted, ref} from "vue";
import api from "@/config/axios.js";
import TableCheck from "@/components/common/TableCheck.vue";
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import router from "@/router/router.js";
import dayjs from "dayjs";
import Tooltip from "@/components/common/ToolTip.vue";
import Alert from "@/components/common/Alert.vue";

const columns = [
  { label: "제목", field: "title" },
  { label: "작성자", field: "createUserName" },
  { label: "작성일", field: "createDatetime" }
];

const columnWidths = ["300px", "90px", "200px"]; // 열 값

const waitingDocs = ref([]);    // 문서 목록
const totalPages = ref(0);      // 전체 페이지 수
const totalItems = ref(0);      // 전체 아이템 수
const currentPage = ref(1);     // 현재 페이지 번호
const pageSize = 10;            // 페이지당 문서 수

const selectedRows = ref([]);
const searchCriteria = ref({
  title: "",
  createUser: "",
  fromDate: null,
  toDate: null,
});

// 툴팁
const tooltipVisible = ref(false);
const tooltipText = "대기 문서란? \n" +
    "내가 결재선에 포함되어 있고, 내가 결재할 차례인 문서"
const tooltipWidth = "400px";

// 대기 문서 목록 조회
const fetchWaitingDocs = async (page = 1) => {
  try {

    const response = (await api.get("/approval/waiting-docs", {
      params: {
        page: page - 1, // Spring의 Pageable은 0부터 시작하므로 -1 처리
        size: pageSize,
      }
    }));
    // api response 에서 데이터 추출
    console.log("대기 문서 조회 결과: ", response.data.content);

    waitingDocs.value = response.data.content;
    totalPages.value = response.data.totalPages;
    totalItems.value = response.data.totalElements;
    currentPage.value = response.data.number + 1; // Vue는 1부터 시작

  } catch (error) {
    console.error("대기 문서 목록 조회 실패", error);
    waitingDocs.value = [];
  }
}

// 일괄 승인
const bulkApproveDocs = async () => {
  if (selectedRows.value.length === 0) {
    showAlert("선택된 문서가 없습니다.");
    return;
  }

  try {
    console.log("선택된 데이터 확인: ", selectedRows.value)
    const approvals = selectedRows.value.map((row) => ({
      docId: row.docId,
      empId: row.empId, // 현재 로그인 한 사용자의 empId
      approveLineId: row.approveLineId,
      approveSbjId: row.approveSbjId,
      empDeptType: "EMPLOYEE",
      status: "APPROVED",
      comment: null,
    }));

    console.log("전달할 데이터: ", approvals);

    const requestData = {approvals};
    await api.put("approval/docs/bulk", requestData);

    showAlert("문서들이 일괄 승인되었습니다.");

    await fetchWaitingDocs(currentPage.value);  // 목록 새로 고침
    selectedRows.value = [];  // 선택 초기화
  } catch (error) {
    console.error("일괄 승인 실패", error);
    showAlert("일괄 승인에 실패하였습니다.")
  }
}

// 선택된 문서 처리
const handleRowSelected = (selected) => {
  console.log("선택된 행 데이터:", selected);
  selectedRows.value = selected;
}

// 검색 조건 변경 처리
const handleSearch = () => {
  console.log("검색 조건: ", searchCriteria.value);
  currentPage.value = 1;  // 검색 시 페이지를 처음으로 초기화
  fetchWaitingDocsWithCriteria();
};

// 특정 열(제목) 클릭 시
const handleTitleClick = (row) => {

  const templateId = row.templateId;

  if (templateId === 4) {
    // 기본 서식
    router.push({ name: "basicDetail", query: { docId: row.docId, type: "waiting" } }, );
  } else if (templateId === 5) {
    router.push({ name: "disbursementDetail", query: {docId: row.docId, type: "waiting" } })
  } else if (templateId === 6) {
    router.push({ name: "workReportDetail", query: {docId: row.docId, type: "waiting" } })
    // 업무 보고서
  } else {
    showAlert("올바르지 않은 서식입니다.")
  }
}


// 날짜 형식 변경
const formatDate = (date) => {
  return date ? dayjs(date).format("YYYY-MM-DD") : null;
}

// 검색하기
const fetchWaitingDocsWithCriteria = async (page = 1) => {
  console.log("검색 조건으로 api 호출: ", searchCriteria.value);

  const formattedCriteria = {
    ...searchCriteria.value,
    fromDate : formatDate(searchCriteria.value.fromDate),
    toDate: formatDate(searchCriteria.value.toDate),
  };

  try {
    const response = await api.get("/approval/waiting-docs/search", {
      params: {
        ...formattedCriteria,
        page: page - 1,
        size: pageSize
      },
    });
    waitingDocs.value = response.data.content;
    totalPages.value = response.data.totalPages;
    totalItems.value = response.data.totalElements;
    currentPage.value = response.data.number + 1;

    console.log("검색 결과: ", response.data.content);
  } catch (error) {
    console.error("검색 실패", error);
    waitingDocs.value = [];
  }
}


const alertVisible = ref(false);
const alertMsg = ref('');
const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
}

onMounted(() => {
  fetchWaitingDocs();
});

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
        <p id="title">대기 문서</p>
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
            :position="{ bottom: '15px', left: '45%' }"
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

  <!-- 테이블과 버튼 컨테이너 -->
  <div id="waiting-doc-container">
    <!-- 테이블 -->
    <div id="waiting-doc-list">
      <TableCheck
          :columns="columns"
          :rows="waitingDocs"
          rowKey="docId"
          :showCheckbox="true"
          :columnWidths="columnWidths"
          @row-selected="handleRowSelected"
      >
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
      </TableCheck>
      <!-- 페이지네이션 -->
      <PagingBar
          :currentPage="currentPage"
          :totalPages="totalPages"
          :totalItems="totalItems"
          :pageSize="pageSize"
          @page-changed="fetchWaitingDocs"
      />
    </div>

    <!-- 버튼 -->
    <div id="bulk-approve-container">
      <ButtonBasic
          color="orange"
          size="medium"
          label="일괄 승인하기"
          @click="bulkApproveDocs"
      />
    </div>
  </div>
</template>

<style scoped>
#waiting-doc-list {
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

#waiting-doc-container {
  display: flex;
  flex-direction: column; /* 테이블과 버튼을 세로로 배치 */
  gap: 10px; /* 테이블과 버튼 간 간격 */
  width: 900px; /* 테이블과 버튼이 같은 폭 */
  margin: 0 auto; /* 중앙 정렬 */
}

#waiting-doc-list {
  display: flex;
  flex-direction: column; /* 테이블과 페이지네이션을 세로로 배치 */
  gap: 10px; /* 테이블과 페이지네이션 간 간격 */
}

#bulk-approve-container {
  display: flex;
  justify-content: flex-end; /* 버튼을 오른쪽 끝으로 배치 */
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