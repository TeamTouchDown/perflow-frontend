<script setup>
import {reactive, onMounted, ref } from "vue";
import {useRouter} from "vue-router";
import api from "@/config/axios.js";
import PagingBar from "@/components/common/PagingBar.vue";
import ExcelDropDown from "@/components/common/ExcelDropDown.vue";
import TableMove from "@/components/common/TableMove.vue";
import ThreeMonthChart from "@/views/payment/OneYearChart.vue";
import ThreeYearByMonthChart from "@/views/payment/ThreeYearByMonthChart.vue";
import ThreeYearChart from "@/views/payment/ThreeYearChart.vue";
import FileUpload from "@/components/common/FileUpload.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import ToolTip from "@/components/common/ToolTip.vue";
import InputField from "@/components/common/InputField.vue";
import Alert from "@/components/common/Alert.vue";

const router = useRouter();

const state = reactive({
  payrolls: [],
  currentPage: 1,
  totalPages: 1,
  totalItems:0,
  pageSize: 10
});

// 보험료 비율 데이터를 저장하는 변수
const insuranceRates = ref({
  nationalPensionRate: '',
  healthInsuranceRate: '',
  hireInsuranceRate: '',
  longTermCareInsuranceRate: ''
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

// 모달 창 표시 여부
const isModalVisible = ref(false);

// 모달 열기
const openModal = async () => {
  isModalVisible.value = true;
};

// 모달 닫기
const closeModal = () => {
  isModalVisible.value = false;
};

const validateForm = () => {
  let isValid = true;

  // 각 보험료가 빈 값이 아닌지 확인
  if (!insuranceRates.value.nationalPensionRate || isNaN(insuranceRates.value.nationalPensionRate)) {
    isValid = false;
  }
  if (!insuranceRates.value.healthInsuranceRate || isNaN(insuranceRates.value.healthInsuranceRate)) {
    isValid = false;
  }
  if (!insuranceRates.value.hireInsuranceRate || isNaN(insuranceRates.value.hireInsuranceRate)) {
    isValid = false;
  }
  if (!insuranceRates.value.longTermCareInsuranceRate || isNaN(insuranceRates.value.longTermCareInsuranceRate)) {
    isValid = false;
  }

  return isValid;
};

// 급여대장 목록을 가져오는 함수
const fetchPayrolls = async (page = 1) => {
  try {
    const response = await api.get(`/hr/payrolls`, {
      params: {
        page
      }
    });
    // 'name' 필드에서 연도와 월을 분리하고, 형식 'YYYY.MM'으로 변환
    state.payrolls = response.data.payrolls.map(payroll => ({
      ...payroll,
      createDatetime: `${payroll.createDatetime.slice(0,4)}.${payroll.createDatetime.slice(5,7)}.${payroll.createDatetime.slice(8,10)}`,
      name: `${payroll.name.slice(13, 15)}월 대장`,  // 예: '202408' -> '2024.08'
      totalEmp: `${payroll.totalEmp}명`,
      totalPay: new Intl.NumberFormat('ko-KR').format(payroll.totalPay) + '원'  // 'totalPay' 값을 천단위로 포맷팅하고 원 추가
    }));
    state.currentPage = response.data.currentPage;
    state.totalPages = response.data.totalPages;
    state.totalItems = response.data.totalItems;
    state.pageSize = response.data.pageSize;
  } catch (error) {
    console.error('급여대장 목록을 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 보험료율을 등록하는 함수
const submitInsuranceRates = async () => {
  // 유효성 검사
  if (!validateForm()) {
    showAlert('유효성 검사에 실패했습니다. 모든 필드를 올바르게 입력해 주세요.');
    return;
  }

  try {
    const response = await api.post(`/hr/insurance-rate`, insuranceRates.value);
    insuranceRates.value = response.data;
    closeModal();
    showAlert('보험료가 성공적으로 설정되었습니다.');
  } catch (error) {
    console.log("보험료율을 등록하는 중 에러가 발생했습니다. : ", error);
    showAlert('보험료율 등록 중 오류가 발생했습니다.');
  }
};

const menuItem = [
  {
    label: '다운로드',
    icon: { src: '/src/assets/image/download_2.png' },
    action: async () => {
      try {
        // 서버에서 파일을 바이너리 형식으로 받아옵니다.
        const response = await api.get(`/hr/payroll-template/download`, { responseType: 'blob' });

        // Blob 데이터를 URL로 변환합니다.
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);

        // 현재 날짜로 파일명을 설정합니다.
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const fileName = `payroll_${year}_${month}.xlsx`; // 예: payroll_2024_12.xlsx

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

const tooltipInsuranceVisible = ref(false);
const tooltipInsuranceText = "보험료율의 기준은 소득 기준이며, 퍼센티지 그대로 입력해주세요.";

// 툴팁 위치와 크기 설정
const tooltipPosition = { bottom: "45px", left: "89.5%" };
const tooltipWidth = "190px";

const tooltipInsurancePosition = { bottom: "45px", left: "72%"};
const tooltipInsuranceWidth = "140px"

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
    const response = await api.post('/hr/payroll-template/upload', formData, {
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
  router.push({name: 'PayrollDetail', params: { payrollId: rowId } });
};

onMounted(() => {
  fetchPayrolls();
});

</script>

<template>
  <div class="container">
    <h1 class="title">급여대장</h1>
    <div>
      <div class="three-month-chart">
        <ThreeMonthChart />
      </div>
      <div class="chart">
        <div class="three-year-by-month-chart">
          <ThreeYearByMonthChart />
        </div>
        <div class="three-year-chart">
          <ThreeYearChart />
        </div>
      </div>
      <hr>
      <div class="excel">
        <div class="excel-btn">
          <div @mouseenter="tooltipInsuranceVisible=true" @mouseleave="tooltipInsuranceVisible=false">
            <button class="insurance-btn" @click="openModal">
              보험료 설정
            </button>
            <ToolTip
                :text="tooltipInsuranceText"
                :visible.sync="tooltipInsuranceVisible"
                :position="tooltipInsurancePosition"
                :width="tooltipInsuranceWidth"
            />
            <!-- 모달 -->
            <div v-if="isModalVisible" class="modal" @click="closeModal">
              <div class="modal-content" @click.stop>
                <h3>보험료 설정</h3>
                <form @submit.prevent="submitInsuranceRates">
                  <div>
                    <InputField
                        v-model="insuranceRates.nationalPensionRate"
                        label="국민연금"
                        placeholder="국민연금 보험료율을 입력해 주세요."
                        :isRequired="true"
                        width="600px"
                    />
                  </div>
                  <div>
                    <InputField
                        v-model="insuranceRates.healthInsuranceRate"
                        label="건강보험"
                        placeholder="건강보험료율을 입력해 주세요."
                        :isRequired="true"
                        width="600px"
                    />
                  </div>
                  <div>
                    <InputField
                        v-model="insuranceRates.hireInsuranceRate"
                        label="고용보험"
                        placeholder="고용보험료율을 입력해 주세요."
                        :isRequired="true"
                        width="600px"
                    />
                  </div>
                  <div>
                    <InputField
                        v-model="insuranceRates.longTermCareInsuranceRate"
                        label="장기요양보험"
                        placeholder="장기요양보험료율을 입력해 주세요."
                        :isRequired="true"
                        width="600px"
                    />
                  </div>
                  <div class="excel-btn" style="flex-direction: row-reverse">
                    <button class="insurance-btn" type="submit">저장</button>
                    <button class="cancel-btn" @click="closeModal">취소</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
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
      </div>
      <div class="table">
        <TableMove
            v-if="state.payrolls && state.payrolls.length > 0"
            :row-key="'payrollId'"
            :rows="state.payrolls"
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
            @page-changed="fetchPayrolls"
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
  font-weight: bold;
  margin: 10px 0 10px 0;
  color: #3c4651;
}

.three-month-chart {
  width: 900px;
  margin-bottom: 10px;
}

.chart {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 900px;
}

.three-year-by-month-chart {
  width: 400px;
}

.three-year-chart {
  width: 400px;
}

hr {
  width: 900px;
}

.excel {
  display: flex;
  flex-direction: row-reverse;
  width: 900px;
  padding: 0;
  margin: 0 0 15px 0;
  position: relative;
}

.excel-btn {
  display: flex;
  flex-direction: row;
  gap: 20px;
}

.insurance-btn {
  width: 100px;
  height: 40px;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: bold;
  color: white;
  background-image: linear-gradient(to right, #f37321 0%, #fb0 100%);
  cursor: pointer;
}

h3 {
  margin-bottom: 50px;
}

.cancel-btn {
  width: 100px;
  height: 40px;
  justify-content: center;
  align-items: center;
  background-color: #D9D9D9;
  color: #3C4651;
  border-radius: 10px;
  font-size: 15px;
  font-weight: bold;
  border: none;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.table {
  width: 900px;
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