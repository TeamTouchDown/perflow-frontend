<script setup>
import {ref, onMounted, computed} from "vue";
import api from "@/config/axios.js";
import { useRoute } from "vue-router";
import SearchBar from "@/components/common/SearchBar.vue";
import ExcelDropDown from "@/components/common/ExcelDropDown.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import FileUpload from "@/components/common/FileUpload.vue";
import ToolTip from "@/components/common/ToolTip.vue";
import Alert from "@/components/common/Alert.vue";
import ButtonBack from "@/components/common/ButtonBack.vue";

const payrolls = ref([]);
const month = ref('');

const route = useRoute();

const isFileUploadVisible = ref(false); // 파일 업로드 창 표시 여부

// 선택된 파일 목록을 저장할 변수
const selectedFiles = ref([]);

const payrollId = route.params.payrollId;

const alertVisible = ref(false);

const alertMsg = ref('');

const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
}

// 금액 포맷 함수
const formatCurrency = (value) => {
  if (!value) return '0';
  return value.toLocaleString(); // 천 단위 ',' 추가
};

// 급여 상세 정보를 가져오는 함수
const fetchPayrollDetail = async () => {
  try {
    const response = await api.get(`/hr/payrolls/${payrollId}`);
    payrolls.value = response.data.payrolls;

    // createDatetime에서 월(Month) 추출
    payrolls.value.forEach((payroll) => {
      month.value = payroll.createDatetime.slice(5, 7);
      // console.log(`해당 급여의 생성 월: ${month}`);
    });
  } catch (error) {
    console.error('급여 상세 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 급여 상세 내역에서 검색 기능을 가져오는 함수
const fetchSearchPayroll = async (empId) =>{
  try {
    const response = await api.get(`/hr/payrolls/${payrollId}/search`, {
      params: {
        empId
      }
    });
    payrolls.value = response.data.payrolls;
    // console.log("searchParams : ", empId);
    // console.log('API 응답:', response.data);  // 응답 내용 확인
  } catch (error) {
    console.error('검색 기능을 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

const menuItem = [
  {
    label: '다운로드',
    icon: { src: '/src/assets/image/download_2.png' },
    action: async () => {
      try {
        // 서버에서 파일을 바이너리 형식으로 받아옵니다.
        const response = await api.get(`/hr/payrolls/${payrollId}/download`, { responseType: 'blob' });

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
    const response = await api.put(`/hr/payrolls/${payrollId}/update`, formData, {
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
const totalPeople = computed(() => payrolls.value.length);

// 각 항목의 총 합계를 계산
const totalPay = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.pay, 0);
});

const totalExtendLaborAllowance = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.extendLaborAllowance, 0);
});

const totalNightLaborAllowance = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.nightLaborAllowance, 0);
});

const totalHolidayLaborAllowance = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.holidayLaborAllowance, 0);
});

const totalAnnualAllowance = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.annualAllowance, 0);
});

const totalIncentive = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.incentive, 0);
});

const totalNationalPension = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.nationalPension, 0);
});

const totalHealthInsurance = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.healthInsurance, 0);
});

const totalHireInsurance = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.hireInsurance, 0);
});

const totalLongTermCareInsurance = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.longTermCareInsurance, 0);
});

const totalIncomeTax = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.incomeTax, 0);
});

const totalLocalIncomeTax = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.localIncomeTax, 0);
});

const totalDeduction = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.totalDeduction, 0);
});

const totalAmount = computed(() => {
  return payrolls.value.reduce((total, item) => total + item.totalAmount, 0);
});

onMounted(() => {
  fetchPayrollDetail();
});
</script>

<template>
  <div class="container">
    <div class="header">
      <ButtonBack />
      <p>{{ month }}월 급여정산</p>
      <div class="search-bar">
        <SearchBar
          placeholder="사번을 입력해주세요."
          width="250px"
          height="40px"
          fontSize="14px"
          @search="fetchSearchPayroll"
        />
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
          <th colspan="2" class="fixed-column shadow-column">기본 정보</th>
          <th colspan="7">지급</th>
          <th colspan="7">공제</th>
          <th rowspan="2">총 합계</th>
          <th rowspan="3">지급 상태</th>
        </tr>
        <tr class="second-header">
          <th rowspan="2" class="fixed-column">대상자 <span class="total">{{ totalPeople }}명</span></th>
          <th rowspan="2" class="fixed-column shadow-column">사번</th>
          <th>기본급</th>
          <th>연장근무수당</th>
          <th>야간근무수당</th>
          <th>휴일근무수당</th>
          <th>연차수당</th>
          <th>성과급</th>
          <th>합계</th>
          <th>국민연금</th>
          <th>건강보험</th>
          <th>고용보험</th>
          <th>장기요양보험</th>
          <th>소득세</th>
          <th>지방소득세</th>
          <th>합계</th>
        </tr>
        <tr class="three-header">
          <th>{{ formatCurrency(totalPay) }}원</th>
          <th>{{ formatCurrency(totalExtendLaborAllowance) }}원</th>
          <th>{{ formatCurrency(totalNightLaborAllowance) }}원</th>
          <th>{{ formatCurrency(totalHolidayLaborAllowance) }}원</th>
          <th>{{ formatCurrency(totalAnnualAllowance) }}원</th>
          <th>{{ formatCurrency(totalIncentive) }}원</th>
          <th>{{ formatCurrency(totalPay) }}원</th>
          <th>{{ formatCurrency(totalNationalPension) }}원</th>
          <th>{{ formatCurrency(totalHealthInsurance) }}원</th>
          <th>{{ formatCurrency(totalHireInsurance) }}원</th>
          <th>{{ formatCurrency(totalLongTermCareInsurance) }}원</th>
          <th>{{ formatCurrency(totalIncomeTax) }}원</th>
          <th>{{ formatCurrency(totalLocalIncomeTax) }}원</th>
          <th>{{ formatCurrency(totalDeduction) }}원</th>
          <th>{{ formatCurrency(totalAmount) }}원</th>
        </tr>
        </thead>
        <tbody>
          <tr v-for="item in payrolls" :key="item.payrollDetailId" class="contain">
            <td class="fixed-column">
              <div class="basic-info">
<!--                <img :src="item.img" alt="프로필 이미지" class="profile-img" />-->
                <div class="profile">
                  <div class="text-info">
                    <p class="name">{{ item.empName }}</p>
                    <p class="department">{{ item.deptName }}</p>
                  </div>
                  <img v-if="item.empStatus === 'ACTIVE'" src="../../assets/image/active.png" alt="재직" />
                </div>
              </div>
            </td>
            <td class="fixed-column">{{ item.empId }}</td>
            <td>{{ formatCurrency(item.pay) }}원</td>
            <td>{{ formatCurrency(item.extendLaborAllowance) }}원</td>
            <td>{{ formatCurrency(item.nightLaborAllowance) }}원</td>
            <td>{{ formatCurrency(item.holidayLaborAllowance) }}원</td>
            <td>{{ formatCurrency(item.annualAllowance) }}원</td>
            <td>{{ formatCurrency(item.incentive) }}원</td>
            <td>{{ formatCurrency(item.totalPayment) }}원</td>
            <td>{{ formatCurrency(item.nationalPension) }}원</td>
            <td>{{ formatCurrency(item.healthInsurance) }}원</td>
            <td>{{ formatCurrency(item.hireInsurance) }}원</td>
            <td>{{ formatCurrency(item.longTermCareInsurance) }}원</td>
            <td>{{ formatCurrency(item.incomeTax) }}원</td>
            <td>{{ formatCurrency(item.localIncomeTax) }}원</td>
            <td>{{ formatCurrency(item.totalDeduction) }}원</td>
            <td>{{ formatCurrency(item.totalAmount) }}원</td>
            <td>{{ item.payrollStatus }}</td>
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

.search-bar {
  display: flex;
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
  left: 140px; /* 첫 번째 열의 너비만큼 설정 */
}

.fixed-column:nth-child(3) {
  left: 240px; /* 두 번째 열의 너비만큼 설정 */
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

/* 프로필 정보 스타일 */
.basic-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-img {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  border: 1px solid #afa9a9;
}

.text-info {
  display: flex;
  flex-direction: column;
}

.profile {
  display: flex;
  align-items: center;
  flex-direction: row;
  width: 124px;
  justify-content: space-between;
}

.name {
  color: #3C4651;
  font-size: 15px;
  font-weight: bold;
  margin: 0;
}

.department {
  font-size: 13px;
  color: #afa9a9;
  margin: 0;
}

img {
  width: 40px;
  height: 20px;
}
</style>

