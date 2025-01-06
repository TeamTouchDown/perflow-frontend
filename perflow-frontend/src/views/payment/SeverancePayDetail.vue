<script setup>
import {ref, onMounted, computed} from "vue";
import api from "@/config/axios.js";
import { useRoute } from "vue-router";
import ExcelDropDown from "@/components/common/ExcelDropDown.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import FileUpload from "@/components/common/FileUpload.vue";
import ToolTip from "@/components/common/ToolTip.vue";
import Alert from "@/components/common/Alert.vue";
import ButtonBack from "@/components/common/ButtonBack.vue";

const severancePays = ref([]);
const month = ref('');

const route = useRoute();

const isFileUploadVisible = ref(false); // 파일 업로드 창 표시 여부

// 선택된 파일 목록을 저장할 변수
const selectedFiles = ref([]);

const severancePayId = route.params.severancePayId;

const alertVisible = ref(false);

const alertMsg = ref('');

const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
}

// console.log("severancePayId : ",severancePayId);

// 금액 포맷 함수
const formatCurrency = (value) => {
  if (!value) return '0';
  return value.toLocaleString(); // 천 단위 ',' 추가
};

// 퇴직금 상세 정보를 가져오는 함수
const fetchPayrollDetail = async () => {
  try {
    const response = await api.get(`/hr/severance-pays/${severancePayId}`);
    severancePays.value = response.data.severancePays;

    severancePays.value.forEach((severancePay) => {
      month.value = severancePay.createDatetime.slice(5, 7);
      // console.log(`해당 급여의 생성 월: ${month}`);
    });
  } catch (error) {
    console.error('퇴직금 상세 정보를 불러오는 중 에러가 발생했습니다. : ', error)
  }
};

const menuItem = [
  {
    label: '다운로드',
    icon: { src: '/src/assets/image/download_2.png' },
    action: async () => {
      try {
        // 서버에서 파일을 바이너리 형식으로 받아옵니다.
        const response = await api.get(`/hr/severance-pay/${severancePayId}/download`, { responseType: 'blob' });

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
const tooltipPosition = {bottom: "-25px", left: "-33%" };
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
    const response = await api.put(`/hr/severance-pays/${severancePayId}/update`, formData, {
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

// 총 인원 수
const totalPeople = computed(() => severancePays.value.length);

onMounted(() => {
  fetchPayrollDetail();
});
</script>

<template>
  <div class="container">
    <div class="header">
      <div class="header-btn">
        <ButtonBack />
        <p>{{ month }}월 퇴직금 정산</p>
      </div>
      <div class="btn">
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
      <!-- 파일 업로드 컴포넌트 -->
      <div v-if="isFileUploadVisible" class="file-upload-modal">
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
          <div style="margin-left: 10px"/>
          <ButtonBasic
              color="gray"
              size="medium"
              label="취소"
              @click="handleCancel"
          />
        </div>
      </div>
      <Alert
          v-model="alertVisible"
          :message="alertMsg"
      />
    </div>
    <div class="table-container">
      <table>
        <thead>
        <tr class="first-header">
          <th colspan="12" class="fixed-column shadow-column">대상자 <span class="total">{{ totalPeople }}명</span></th>
        </tr>
        <tr class="second-header">
          <th rowspan="2" class="fixed-column">사번</th>
          <th rowspan="2" class="fixed-column shadow-column">이름</th>
          <th rowspan="2">입사일</th>
          <th rowspan="2">퇴사일</th>
          <th rowspan="2">직위</th>
          <th rowspan="2">부서</th>
          <th colspan="4">정산기준</th>
          <th rowspan="2">총 합계</th>
          <th rowspan="2">상태</th>
        </tr>
        <tr class="three-header">
          <th>3개월 간 기본급</th>
          <th>3개월 간 근무일 수</th>
          <th>3개월 간 총 수당</th>
          <th>재직일 수</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="item in severancePays" :key="item.severancePayDetailId" class="contain">
          <td class="fixed-column">{{ item.empId }}</td>
          <td class="fixed-column">{{ item.empName }}</td>
          <td>{{ item.joinDate }}</td>
          <td>{{ item.resignDate }}</td>
          <td>{{ item.positionName }}</td>
          <td>{{ item.deptName }}</td>
          <td>{{ formatCurrency(item.threeMonthTotalPay) }}원</td>
          <td>{{ item.threeMonthTotalDays }}일</td>
          <td>{{ formatCurrency(item.threeMonthTotalAllowance) }}원</td>
          <td>{{ item.totalLaborDays }}일</td>
          <td>{{ formatCurrency(item.totalSeverancePay) }}원</td>
          <td>{{ item.severanceStatus }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  width: 900px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header p {
  color: #3C4651;
  font-size: 35px;
  font-weight: bold;
  margin: 0;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 30px;
  justify-content: space-between;
  position: relative;
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

.table-container {
  margin-top: 50px;
  width: 900px;
  border: 1px solid #AFA9A9; /* 바깥 테두리 색상 */
  border-radius: 10px;
  max-height: 500px; /* 테이블 높이 고정 */
  overflow-y: auto; /* 세로 스크롤 활성화 */
  overflow-x: auto; /* 가로 스크롤 활성화 */
  position: relative;
}

table {
  width: 1500px;
  border-collapse: collapse; /* 테이블 선이 끊어지지 않도록 설정 */
  text-align: left;
}

/* 스크롤 디자인 */
.table-container::-webkit-scrollbar {
  width: 10px; /* 세로 스크롤 너비 */
  height: 10px; /* 가로 스크롤 높이 */
}

.table-container::-webkit-scrollbar-thumb {
  background-color: #888; /* 스크롤바 색상 */
  border-radius: 10px; /* 둥근 모서리 */
  border: 3px solid #f1f1f1; /* 스크롤바와 배경 사이에 여백을 주는 흰색 테두리 */
}

.table-container::-webkit-scrollbar-thumb:hover {
  background-color: #555; /* 스크롤바 hover 시 색상 변경 */
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1; /* 스크롤바 배경 색상 */
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.first-header {
  font-size: 20px;
}

.first-header th {
  min-width: 100px;
}

.second-header, .three-header {
  font-size: 15px;
}

.second-header th {
  min-width: 100px;
}

.total {
  color: #afa9a9;
  margin-left: 5px;
}

/* 헤더 스타일 */
thead th {
  position: sticky; /* 고정 헤더 */
  z-index: 2;
  background-color: #fff; /* 고정 헤더 배경색 */
  border-bottom: 1px solid #afa9a9; /* 아래 선 추가 */
  color: #3C4651;
  border-right: 1px solid #afa9a9;
  white-space: nowrap; /* 텍스트 줄바꿈 방지 */
  padding: 0 8px 0 8px;
}

/* 첫 번째 열 (대상자) 고정 */
.fixed-column {
  position: sticky;
  left: 0; /* 첫 번째 열 고정 */
  z-index: 3; /* 헤더보다 위에 표시 */
  background-color: #fff; /* 배경색 설정 */
  border-right: 1px solid #afa9a9; /* 오른쪽 경계선 */
}

/* 두 번째 열 (사번) 고정 */
.fixed-column.shadow-column {
  position: sticky;
  z-index: 3;
  background-color: #fff;
  border-right: 1px solid #afa9a9;
  box-shadow: 2px 0 5px #888888; /* 오른쪽 그림자 추가 */
}

/* 첫 번째 열의 다음 열도 고정 */
.fixed-column:nth-child(2) {
  left: 120px; /* 첫 번째 열의 너비만큼 설정 */
}

/* 테이블 행 및 데이터 스타일 */
tbody tr {
  border-bottom: 1px solid #afa9a9; /* 행 아래 선 추가 */
}

tbody td {
  text-align: left;
  vertical-align: middle; /* 세로 정렬 */
  padding: 5px 8px 5px 8px;
  white-space: nowrap; /* 텍스트 줄바꿈 방지 */
  border-right: 1px solid #afa9a9;
  font-size: 15px;
}
</style>

