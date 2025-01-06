<script setup xmlns="http://www.w3.org/1999/html">
import {onMounted, ref} from "vue";
import api from "@/config/axios.js";
import MainPageButton from "@/components/common/MainPageButton.vue";

const severancePayStub = ref(null);
const employee = ref(null);
const company = ref(null);
const overtime = ref(null);

const severancePayDate = ref(null); // 퇴직금 지급일
const countingDateStart = ref(null); // 집계 시작일
const countingDateEnd = ref(null); // 집계 종료일
const annualDateStart = ref(null); // 연차 수당 집계 시작일
const annualDateEnd = ref(null); // 연차 수당 집계 종료일

const alertVisible = ref(false);

const alertMsg = ref('');

const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
}

// 퇴직 명세서를 가져오는 함수
const fetchSeverancePayStub = async () => {
  try {
    const response = await api.get(`/severance-stub`);
    severancePayStub.value = response.data.severancePayStub;

    const resignDate = severancePayStub.value.resignDate; // 이미 날짜 형식
    const payDate = new Date(resignDate);
    payDate.setDate(payDate.getDate() + 10); // 10일 추가

    severancePayDate.value = `${payDate.getFullYear()}.${(payDate.getMonth() + 1).toString().padStart(2, '0')}.${payDate.getDate().toString().padStart(2, '0')}`;

    // 집계 시작일 (퇴직일 기준 3개월)
    const startDate = new Date(resignDate);
    startDate.setMonth(startDate.getMonth() - 3); // 3개월 전으로 이동
    startDate.setDate(startDate.getDate()); // 퇴직일의 일로 설정
    countingDateStart.value = `${startDate.getFullYear()}.${(startDate.getMonth() + 1).toString().padStart(2, '0')}.${startDate.getDate().toString().padStart(2, '0')}`;

    // 집계 종료일 (퇴직일 기준 전날)
    const endDate = new Date(resignDate);
    endDate.setDate(endDate.getDate() - 1); //퇴직일의 전날
    countingDateEnd.value = `${endDate.getFullYear()}.${(endDate.getMonth() + 1).toString().padStart(2, '0')}.${endDate.getDate().toString().padStart(2, '0')}`;

    // 연차 집계 시작일 (퇴직일 기준 1년 전)
    const annualStartDate = new Date(resignDate);
    annualStartDate.setFullYear(annualStartDate.getFullYear()); // 1년 전으로 이동
    annualStartDate.setMonth(0);
    annualStartDate.setDate(1); // 퇴직일의 일로 설정
    annualDateStart.value = `${annualStartDate.getFullYear()}.${(annualStartDate.getMonth() + 1).toString().padStart(2, '0')}.${annualStartDate.getDate().toString().padStart(2, '0')}`;

    // 연차 집계 종료일 (퇴직일 기준 하루 전)
    const annualEndDate = new Date(resignDate);
    annualEndDate.setDate(annualEndDate.getDate() - 1); // 퇴직일의 하루 전
    annualDateEnd.value = `${annualEndDate.getFullYear()}.${(annualEndDate.getMonth() + 1).toString().padStart(2, '0')}.${annualEndDate.getDate().toString().padStart(2, '0')}`;
  } catch (error) {
    console.log('퇴직 명세서 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 사원 정보를 가져오는 함수
const fetchEmp = async () => {
  try {
    const response = await api.get(`/employees`);
    const data = Array.isArray(response.data) ? response.data : [response.data]; // 배열로 변환
    employee.value = data.map(emp => ({
      ...emp,
      rrn: `${emp.rrn.slice(0, 2)}.${emp.rrn.slice(2, 4)}.${emp.rrn.slice(4, 6)}`,
    }));
  } catch (error) {
    console.error('사원 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 회사 정보를 가져오는 함수
const fetchPayDate = async () => {
  try {
    const response = await api.get(`/company`);
    company.value = response.data;  // 급여 지급일 (Unix timestamp)

  } catch (error) {
    console.error('회사 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 초과근무 정보를 가져오는 함수
const fetchOverTime = async () => {
  try {
    const response = await api.get(`/emp/overtimes/monthly-summary`);
      overtime.value = response.data;
  } catch (error) {
    console.log('초과근무 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 초과근무 시간을 계산하는 함수
const calculateOvertimeHours = (start, end) => {
  if (start && end) {
    return getDurationInHours(start, end)
  }
  return 0
}

// 초과근무 시간 계산 (시작 시간과 종료 시간의 차이 계산)
const getDurationInHours = (start, end) => {
  const startTime = new Date(start)
  const endTime = new Date(end)
  const durationInSeconds = (endTime - startTime) / 1000 // 초 단위로 차이 계산
   // 시간 단위로 변환
  return Math.floor(durationInSeconds / 3600)
}

// 금액 포맷 함수
const formatCurrency = (value) => {
  if (!value) return '0';
  return value.toLocaleString(); // 천 단위 ',' 추가
};

// 인쇄 기능 구현
const printSection = () => {
  const content = document.getElementById('contentToPrint');  // 인쇄할 영역 선택
  const printWindow = window.open('', '', 'height=1800,width=1800');  // 새 창 열기
  printWindow.document.write('<html><head><title>급여명세서 인쇄</title>');

  // 페이지 스타일을 현재 문서에서 복사하여 인쇄 창에 적용
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
  styles.forEach(style => {
    printWindow.document.write(style.outerHTML);  // 스타일 복사
  });

  printWindow.document.write('</head><body>');
  printWindow.document.write(content.innerHTML);  // 인쇄할 영역의 내용 복사
  printWindow.document.write('</body></html>');
  printWindow.document.close();  // 문서 닫기

  // 문서가 로드된 후 인쇄하기
  setTimeout(() => {
    printWindow.print();  // 인쇄
    printWindow.close();   // 인쇄 후 창 닫기 (필요시)
  }, 1);  // 1초 대기 후 인쇄
};

const checkResigned = () => {
  console.log("checkResigned 호출");

  if (!employee || employee.status !== 'RESIGNED') {
    showAlert('퇴직대상자가 아닙니다.');
    history.back();
  }
};

onMounted(() => {
  fetchSeverancePayStub();
  fetchEmp();
  fetchPayDate();
  // fetchOverTime();
});
</script>

<template>
  <div class="container">
    <div class="head">
      <!-- 인쇄 버튼 추가 -->
      <MainPageButton
          label="인쇄"
          color="orange"
          @click="printSection"
      />
    </div>
    <div id="contentToPrint">
      <div class="pay-name">
        <div>퇴직금명세서</div>
      </div>
      <div class="employee">
        <div v-for="emp in employee" :key="emp.empId">
          <div>{{ emp.name }} </div>
          <div> | </div>
          <div> {{ emp.rrn }} </div>
          <div> | </div>
          <div> {{ `${severancePayStub?.resignDate.slice(2,4)}.${severancePayStub?.resignDate.slice(5,7)}.${severancePayStub?.resignDate.slice(8,10)}` }} </div>
          <div> | </div>
          <div> {{ emp.empId }} </div>
          <div> | </div>
          <div> {{ emp.deptName }} </div>
          <div> | </div>
          <div> {{ emp.positionName }} </div>
          <div> | </div>
          <div> {{ Math.floor(severancePayStub?.totalLaborDays / 365 )}}년({{ severancePayStub?.totalLaborDays }}일) </div>
        </div>
      </div>
      <div class="pay-date">
        <div class="date">
          <h2>실수령액</h2>
          <div>{{ severancePayDate }} 지급</div>
        </div>
        <p>{{ formatCurrency(severancePayStub?.totalAmount) }}원</p>
      </div>
      <div class="pay-list">
        <h3>지급내역</h3>
      </div>
      <div class="pay">
        <h4>기본급</h4>
        <div>{{ formatCurrency(severancePayStub?.totalPay) }}원</div>
      </div>
      <div class="pay">
        <h4>수당</h4>
        <div>{{ formatCurrency(severancePayStub?.totalAllowance) }}원</div>
      </div>
      <div class="over-list">
        <div class="all">
          <div class="date">
            <div>연차수당</div>
            <p>{{ annualDateStart }} ~ {{ annualDateEnd }} 내 집계</p>
          </div>
          <div>{{ formatCurrency(severancePayStub?.totalAnnulAllowance) }}원</div>
        </div>
        <div class="all-list" >
          <div class="all" v-if="severancePayStub?.totalExtendLaborAllowance > 0">
            <div class="allowance">
              <div>연장근무수당</div>
              <img src="../../assets/image/allowance.png" alt="allowance" />
<!--              <p>{{ calculateOvertimeHours(overtimeItem.overtimeStart, overtimeItem.overtimeEnd) }}시간</p>-->
            </div>
            <div>{{ formatCurrency(severancePayStub?.totalExtendLaborAllowance) }}원</div>
          </div>

          <div class="all" v-if="severancePayStub?.totalNightLaborAllowance > 0">
            <div class="allowance">
              <div>야간근무수당</div>
              <img src="../../assets/image/allowance.png" alt="allowance" />
<!--              <p>{{ calculateOvertimeHours(overtimeItem.overtimeStart, overtimeItem.overtimeEnd) }}시간</p>-->
            </div>
            <div>{{ formatCurrency(severancePayStub?.totalNightLaborAllowance) }}원</div>
          </div>

          <div class="all" v-if="severancePayStub?.totalHolidayLaborAllowance > 0">
            <div class="allowance">
              <div>휴일근무수당</div>
              <img src="../../assets/image/allowance.png" alt="allowance" />
<!--              <p>{{ calculateOvertimeHours(overtimeItem.overtimeStart, overtimeItem.overtimeEnd) }}시간</p>-->
            </div>
            <div>{{ formatCurrency(severancePayStub?.totalHolidayLaborAllowance) }}원</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.head {
  width: 900px;
  display: flex;
  flex-direction: row-reverse;
  margin-top: 20px;
}

.pay-name {
  display: flex;
  align-items: center;
  width: 900px;
  margin-top: 20px;
}

.pay-name div {
  color: #3C4651;
  font-weight: bold;
  font-size: 40px;
}

.pay-name img {
  width: 30px;
  height: 30px;
}

.pay-name button {
  background: none;
  border: none;
  cursor: pointer;
}

.pay-name button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.employee {
  width: 900px;
  margin-top: 20px;
  color: #afa9a9;
  font-size: 20px;
}

.employee div {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.pay-date {
  display: flex;
  justify-content: space-between;
  width: 900px;
  margin-top: 40px;
  padding-bottom: 5px;
  align-items: center;
}

.date {
  display: flex;
}

.pay-date h2 {
  color: #3C4651;
  font-weight: bold;
  font-size: 32px;
  margin: 0 20px 0 0 ;
}

.pay-date div {
  color: #afa9a9;
  font-size: 15px;
  margin-top: 17px;
}

.pay-date p {
  color: #3C4651;
  font-size: 32px;
  font-weight: bold;
  padding: 0;
  margin: 0;
}

.pay-list {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 900px;
  color: #3C4651;
  font-weight: bold;
  font-size: 25px;
  margin-top: 50px;
  padding-bottom: 7px;
  border-bottom: 2px solid #888888;
}

.pay-list h3 {
  color: #3C4651;
  font-weight: bold;
  font-size: 25px;
  align-items: center;
  margin: 0;
}

.pay {
  display: flex;
  justify-content: space-between;
  text-align: center;
  width: 900px;
  margin-top: 10px;
  padding-bottom: 7px;
  border-bottom: 2px solid #888888;
}

.pay h4, .pay div {
  color: #3C4651;
  font-weight: bold;
  font-size: 20px;
  margin: 0;
}

.over-list {
  text-align: center;
  width: 800px;
  margin-top: 5px;
  margin-left: 100px;
  margin-bottom: 50px;
  color: #3C4651;
  font-size: 15px;
}

.allowance {
  display: flex;
}

.allowance h5 {
  color: #3C4651;
  font-size: 15px;
  margin: 0 20px 0 0 !important;
}

.allowance img {
  width: 40px;
  height: 20px;
  margin: 0 10px;
}

.allowance p {
  color: #afa9a9;
  margin: 0;
}

.all-list {
  text-align: center;
  width: 700px;
  margin-left: 100px;
}

.all {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-bottom: 5px;
  border-bottom: 2px solid #D9D9D9;
  color: #3C4651;
  font-size: 15px;
}

.all div {
  color: #3C4651;
  font-size: 15px;
}

.all p {
  color: #afa9a9;
  margin: 0 0 0 10px;
}

div h1 {
  align-items: center;
  justify-content: center;
}
</style>