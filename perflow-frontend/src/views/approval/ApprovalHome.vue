<script setup>

import TableMini from "@/components/common/TableMini.vue";
import router from "@/router/router.js";
import {computed, onMounted, ref} from "vue";
import api from "@/config/axios.js";

// 초기화
const waitingDocs = ref(null);
const processedDocs = ref(null);
const inboxDocs = ref(null);
const outboxDocs = ref(null);

// rows, columns
const waitingRows = computed(() => {
  return (waitingDocs.value || []).map((doc) => ({
    docId: doc.docId,
    title: truncateTitle(doc.title),
    createUserName: doc.createUserName,
    createDatetime: formatDate(doc.createDatetime),
  }));
});

const waitingColumns = [
  { field: "title", label: "제목" },
  { field: "createUserName", label: "작성자" },
  { field: "createDatetime", label: "작성일시" },
];

const processedRows = computed(() => {
  return (processedDocs.value || []).map((doc) => ({
    docId: doc.docId,
    title: truncateTitle(doc.title),
    createUserName: doc.createUserName,
    createDatetime: formatDate(doc.createDatetime),
  }));
});

const processedColumns = [
  { field: "title", label: "제목" },
  { field: "createUserName", label: "작성자" },
  { field: "createDatetime", label: "작성일시" },
];

const inboxRows = computed(() => {
  return (inboxDocs.value || []).map((doc) => ({
    docId: doc.docId,
    title: truncateTitle(doc.title),
    createUserName: doc.createUserName,
    createDatetime: formatDate(doc.createDatetime),
  }));
});

const inboxColumns = [
  { field: "title", label: "제목" },
  { field: "createUserName", label: "작성자" },
  { field: "createDatetime", label: "작성일시" },
];

const outboxRows = computed(() => {
  return (outboxDocs.value || []).map((doc) => ({
    docId: doc.docId,
    status: formatStatus(doc.status),
    title: truncateTitle(doc.title),
    createDatetime: formatDate(doc.createDatetime),
  }));
});

const outboxColumns = [
  { field: "status", label: "상태" },
  { field: "title", label: "제목" },
  { field: "createDatetime", label: "작성일시" },
];

// 데이터 가져오기
const fetchWaitingDocs = async () => {
  try {
    const response = await api.get("/approval/waiting-docs", {
      params: { size: 10 },
    });
    waitingDocs.value = response.data.content;
    console.log("waitingDocs.value: ", waitingDocs.value);
  } catch (error) {
    console.error("대기 문서 데이터를 가져오는 중 오류 발생:", error);
  }
};

const fetchProcessedDocs = async () => {
  try {
    const response = await api.get("/approval/processed-docs", {
      params: { size: 10 },
    });
    processedDocs.value = response.data.content;
    console.log("processedDocs.value: ", processedDocs);
  } catch (error) {
    console.error("처리 문서 데이터를 가져오는 중 오류 발생:", error);
  }
}

const fetchInboxDocs = async () => {
  try {
    const response = await api.get("/approval/inbox", {
      params: { size: 10 },
    });
    inboxDocs.value = response.data.content;
    console.log("inboxDocs.value: ", inboxDocs.value);
  } catch (error) {
    console.error("수신함 문서 데이터를 가져오는 중 오류 발생:", error);
  }
}

const fetchOutboxDocs = async () => {
  try {
    const response = await api.get("/approval/outbox", {
      params: { size: 10 },
    });
    outboxDocs.value = response.data.content;
    console.log("outboxDocs.value: ", outboxDocs.value);
  } catch (error) {
    console.error("발신함 문서 데이터를 가져오는 중 오류 발생:", error);
  }
}

// 라우팅
const goToWaiting = () => {
  router.push('/approval/waiting')
}

const goToProcessed = () => {
  router.push('/approval/processing')
}

const goToInbox = () => {
  router.push('/approval/inbox')
}

const goToOutbox = () => {
  router.push('/approval/outbox')
}

// title 이 10자 이상일 경우 ... 로 대체
const truncateTitle = (title) => {
  return title.length > 10 ? title.substring(0, 10) + '...' : title;
}

// 날짜 형식 변경
const formatDate = (dateString) => {
  return `${dateString.slice(0, 4)}.${dateString.slice(5, 7)}.${dateString.slice(8, 10)}`;
};

// 상태 이름 변경
const formatStatus = (status) => {
  switch (status) {
    case "ACTIVATED":
      return "진행";
    case "REJECTED":
      return "반려";
    case "APPROVED":
      return "승인";
    default:
      return "기타";
  }
};

onMounted(() => {
  fetchWaitingDocs();
  fetchProcessedDocs();
  fetchInboxDocs();
  fetchOutboxDocs();
})
</script>

<template>
  <div class="home-container">
    <!-- 헤더 -->
<!--    <div class="home-header">-->
<!--      <span class="home-title">결재 홈</span>-->
<!--    </div>-->

    <!-- 내용 -->
    <div class="home-content">
      <div class="doc-row">
        <!-- 문서함 -->
          <!-- 대기 문서 -->
          <div class="doc-box">
            <div class="doc-title">
              <Button @click="goToWaiting">
                대기 문서
                <img src="../../assets/image/left.png" alt="left" />
              </Button>
            </div>
            <TableMini
                row-key="docId"
                :rows="waitingRows"
                :columns="waitingColumns"
            />
          </div>
          <!-- 처리 문서 -->
          <div class="doc-box">
            <div class="doc-title">
              <Button @click="goToProcessed">
                처리 문서
                <img src="../../assets/image/left.png" alt="left" />
              </Button>
            </div>
            <TableMini
                row-key="docId"
                :rows="processedRows"
                :columns="processedColumns"
            />
          </div>
      </div>

      <div class="doc-row">
          <!-- 수신함 -->
          <div class="doc-box">
            <div class="doc-title">
              <Button @click="goToInbox">
                수신함
                <img src="../../assets/image/left.png" alt="left" />
              </Button>
            </div>
            <TableMini
                row-key="docId"
                :rows="inboxRows"
                :columns="inboxColumns"
            />
          </div>

          <!-- 발신함 -->
          <div class="doc-box">
            <div class="doc-title">
              <Button @click="goToOutbox">
                발신함
                <img src="../../assets/image/left.png" alt="left" />
              </Button>
            </div>
            <TableMini
                row-key="docId"
                :rows="outboxRows"
                :columns="outboxColumns"
            />
          </div>
        </div>

    </div>
  </div>
</template>

<style scoped>
/* 컨테이너 */
.home-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  margin: 0 auto;
}

.home-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.doc-row {
  display: flex;  /* 가로 배치 */
  gap: 20px;  /* 문서 간 간격 */
  justify-content: space-between; /* 양쪽 정렬 */
  width: 900px;
}

.home-header {
  text-align: left;
  margin-bottom: 20px;
}

.home-title {
  font-size: 24px;
  font-weight: bold;
  color: #3C4651;
}

.doc-box {
  flex: 1;
  padding: 20px;
}


/* 제목, 이미지 버튼 스타일 */
.doc-title {
  display: flex;
  justify-content: left;
  margin-bottom: 20px;
}

.doc-title button {
  border: none;
  background: none;
  cursor: pointer;
  color: #3C4651;
  font-size: 25px;
  font-weight: bold;
  padding: 0;
}

.doc-box img {
  width: 30px;
  height: 30px;
  margin-bottom: 5px;
}

</style>