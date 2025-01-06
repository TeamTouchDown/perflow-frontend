<script setup>
import {reactive, onMounted, ref } from "vue";
import {useRouter} from "vue-router";
import api from "@/config/axios.js";
import PagingBar from "@/components/common/PagingBar.vue";
import ExcelDropDown from "@/components/common/ExcelDropDown.vue";
import TableMove from "@/components/common/TableMove.vue";
import FileUpload from "@/components/common/FileUpload.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import ToolTip from "@/components/common/ToolTip.vue";
import Alert from "@/components/common/Alert.vue";

const router = useRouter();

const state = reactive({
  severancePays: [],
  currentPage: 1,
  totalPages: 1,
  totalItems:0,
  pageSize: 10
});

const isFileUploadVisible = ref(false); // 파일 업로드 창 표시 여부

// 선택된 파일 목록을 저장할 변수
const selectedFiles = ref([]);

const alertVisible = ref(false);

const alertMsg = ref('');

const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
}

// 퇴직금 목록을 가져오는 함수
const fetchSeverancePays = async (page = 1) => {
  try {
    const response = await api.get(`/hr/severance-pays`, {
      params: {
        page
      }
    });
    // 'name' 필드에서 연도와 월을 분리하고, 형식 'YYYY.MM'으로 변환
    state.severancePays = response.data.severancePays.map(severancePay => ({
      ...severancePay,
      createDatetime: `${severancePay.createDatetime.slice(0,4)}.${severancePay.createDatetime.slice(5,7)}.${severancePay.createDatetime.slice(8,10)}`,
      name: `${severancePay.name.slice(18, 20)}월 퇴직금`,  // 예: '202408' -> '2024.08'
      totalEmp: `${severancePay.totalEmp}명`,
      totalPay: new Intl.NumberFormat('ko-KR').format(severancePay.totalPay) + '원'  // 'totalPay' 값을 천단위로 포맷팅하고 원 추가
    }));
    state.currentPage = response.data.currentPage;
    state.totalPages = response.data.totalPages;
    state.totalItems = response.data.totalItems;
    state.pageSize = response.data.pageSize;
  } catch (error) {
    console.error('퇴직금 목록을 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

const menuItem = [
  {
    label: '다운로드',
    icon: { src: '/src/assets/image/download_2.png' },
    action: async () => {
      try {
        // 서버에서 파일을 바이너리 형식으로 받아옵니다.
        const response = await api.get(`/hr/severance-pay-template/download`, { responseType: 'blob' });

        // Blob 데이터를 URL로 변환합니다.
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);

        // 현재 날짜로 파일명을 설정합니다.
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const fileName = `severancePay_${year}_${month}.xlsx`; // 예: payroll_2024_12.xlsx

        // 다운로드를 위한 가상 링크를 생성합니다.
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName); // 동적으로 파일명 설정
        document.body.appendChild(link);
        link.click(); // 다운로드 시작

        // 다운로드 후 링크를 제거합니다.
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url); // URL 객체를 해제합니다.
      } catch (error) {
        console.error('파일 다운로드 중 오류 발생:', error);
        showAlert('파일 다운로드에 실패했습니다.');
      }
    }
  },
  {
    label: "업로드",
    icon: { src: "/src/assets/image/upload_2.png" },
    action: () => (isFileUploadVisible.value = true), // 업로드 창 표시
  },
];

const tooltipVisible = ref(false);
const tooltipText = "금액을 입력하거나 수정하려면 엑셀 파일을 1. 다운로드 받고 양식에 맞게 값을 입력한 후, 2. 업로드 해주세요.";

// 툴팁 위치와 크기 설정
const tooltipPosition = { bottom: "45px", left: "89.5%" };
const tooltipWidth = "190px";

// 파일 업로드 핸들러
const handleFileUpload = async () => {
  if (selectedFiles.value.length === 0) {
    showAlert("업로드할 파일을 선택해주세요.");
    return;
  }

  const formData = new FormData();
  selectedFiles.value.forEach(file => {
    formData.append('file', file);
  });

  try {
    const response = await api.post('/hr/severance-template/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log("업로드 성공:", response.data);
    showAlert("파일이 성공적으로 업로드되었습니다.");
    isFileUploadVisible.value = false; // 모달 닫기
  } catch (error) {
    console.error("업로드 실패:", error);
    showAlert("파일 업로드 중 오류가 발생했습니다.");
  }
};

// 파일 선택 이벤트 핸들러
const handleFilesSelected = (files) => {
  selectedFiles.value = files;
};

// 파일 업로드 모달 닫기 함수
const handleCancel = () => {
  isFileUploadVisible.value = false; // 모달 숨기기
};

const columns = [
  { field: 'createDatetime',  label: '작성일' },
  { field: 'name',            label: '이름' },
  { field: 'totalEmp',        label: '총 인원' },
  { field: 'totalPay',        label: '총 지급액' },
];

// 행 선택 시 페이지 이동 처리
const handleRowSelected = (rowId) => {
  // 선택된 행의 ID로 페이지 이동
  router.push({name: 'SeverancePayDetail', params: { severancePayId: rowId } });
};

onMounted(() => {
  fetchSeverancePays();
});

</script>

<template>
  <div class="container">
    <h1 class="title">퇴직금정산</h1>
    <div>
      <div class="excel">
        <div @mouseenter="tooltipVisible=true" @mouseleave="tooltipVisible=false">
          <ExcelDropDown
              buttonName="엑셀"
              :menuItems="menuItem"
          />
          <!-- 툴팁 -->
          <ToolTip
              :text="tooltipText"
              :visible.sync="tooltipVisible"
              :position="tooltipPosition"
              :width="tooltipWidth"
          />
        </div>
      </div>
      <div class="table">
        <TableMove
            v-if="state.severancePays && state.severancePays.length > 0"
            :row-key="'severancePayId'"
            :rows="state.severancePays"
            :columns="columns"
            @rowSelected="handleRowSelected"
        />
      </div>
      <div class="paging-bar">
        <PagingBar
            :currentPage="state.currentPage"
            :totalPages="state.totalPages"
            :totalItems="state.totalItems"
            :pageSize="state.totalPages"
            @page-changed="fetchSeverancePays"
        />
      </div>
    </div>
    <!-- 파일 업로드 컴포넌트 -->
    <div v-if="isFileUploadVisible" class="file-upload-overlay" @click="handleCancel">
      <div class="file-upload-modal" @click.stop>
        <FileUpload
            mode="both"
            :buttonWidth="'150px'"
            :buttonHeight="'50px'"
            :multiple="false"
            @files-selected="handleFilesSelected"
        />
        <div class="button">
          <ButtonBasic
              color="orange"
              size="medium"
              label="업로드"
              @click="handleFileUpload"
          />
          <div style="margin-left: 10px"></div>
          <ButtonBasic
              color="gray"
              size="medium"
              label="취소"
              @click="handleCancel"
          />
        </div>
      </div>
    </div>
    <Alert
        v-model="alertVisible"
        :message="alertMsg"
    />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  width: 900px;
  justify-content: center;
  font-size: 35px;
  font-weight: bold;
  margin: 20px 0 30px 0;
  color: #3c4651;
}

.excel {
  display: flex;
  flex-direction: row-reverse;
  width: 900px;
  padding: 0;
  margin: 0 0 40px 0;
  position: relative;
}

.table {
  width: 900px;
  margin-top: 30px;
}

.paging-bar {
  width: 900px
}

.file-upload-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.file-upload-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: white;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  width: 450px;
}

.button {
  margin-top: 10px;
  display: flex;
  flex-direction: row-reverse;
  margin-right: 10px;
}

</style>