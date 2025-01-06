<script setup xmlns="http://www.w3.org/1999/html">
import {onMounted, ref} from "vue";
import api from "@/config/axios.js";
import MainPageButton from "@/components/common/MainPageButton.vue";

const payStub = ref(null);
const employee = ref(null);
const company = ref(null);
const overtime = ref([]);

const month = ref(0); // 초기 값 0
const formattedPayStubYear = ref(null);
const formattedPayStubMonth = ref(null);
const formattedCountingDateStart = ref(null);
const formattedCountingDateEnd = ref(null);
const payStubDate = ref(null);

// 급여 명세서를 가져오는 함수
const fetchPayStub = async (preMonth = month.value) => {
  try {
    const response = await api.get(`/pay-stub`, {
      params: {
        preMonth
      }
    });
    const payStubData = response.data.payStub;

    // 급여 명세서에서 필요한 값들 더하기
    const totalOver =
        payStubData.extendLaborAllowance +
        payStubData.nightLaborAllowance +
        payStubData.holidayLaborAllowance +
        payStubData.annualAllowance +
        payStubData.incentive;

    // totalOver 값을 payStub 데이터에 추가
    payStub.value = {
      ...payStubData,
      totalOver: totalOver,
    };

  } catch (error) {
    console.log('급여 명세서 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 달 업데이트 함수
const updateMonth = (change) => {
  // 값 업데이트
  month.value = month.value + change;

  console.log("현재 월: ", month.value); // 디버깅용, 값 업데이트 확인

  // 업데이트된 값을 기반으로 데이터 요청
  fetchPayStub();
  calculatePayStubDate();
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

    calculatePayStubDate();
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

// 급여 관련 날짜 계산 함수
const calculatePayStubDate = () => {
  if (company.value && company.value.paymentDatetime !== undefined) {
    const payStubDay = company.value.paymentDatetime;
    const currentDate = new Date();
    const payStubYear = currentDate.getFullYear();
    const payStubMonth = currentDate.getMonth();

    // 월 이동 처리
    const updatedMonth = payStubMonth - month.value;
    const updatedYear = payStubYear + Math.floor(updatedMonth / 12);  // 월이 12 이상이면 연도 변경
    const finalMonth = ((updatedMonth % 12) + 12) % 12; // 음수 월을 0~11 사이로 보정

    const payStubDateInstance = new Date(updatedYear, finalMonth, payStubDay);

    // 포맷팅 함수
    const formatDate = (date) => {
      return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    };

    // 포맷팅된 급여 지급일
    formattedPayStubYear.value = payStubDateInstance.getFullYear();
    formattedPayStubMonth.value = (payStubDateInstance.getMonth() + 1).toString().padStart(2, '0');
    payStubDate.value = formatDate(payStubDateInstance);

    // 집계 날짜 시작 (전달 첫 번째 날)
    const countingDateStart = new Date(updatedYear, finalMonth - 1, 1);
    formattedCountingDateStart.value = formatDate(countingDateStart);

    // 집계 날짜 종료 (이번 달 마지막 날)
    const countingDateEnd = new Date(updatedYear, finalMonth, 0);
    formattedCountingDateEnd.value = formatDate(countingDateEnd);

    // 결과 출력
    // console.log('급여 지급일:', payStubDate.value);
    // console.log('집계 시작일:', formattedCountingDateStart.value);
    // console.log('집계 종료일:', formattedCountingDateEnd.value);

  } else {
    console.error('company.value.paymentDatetime을 가져올 수 없습니다.');
  }
};

onMounted(() => {
  fetchPayStub();
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
        <button @click="updateMonth(1)" >
          <img src="../../assets/image/previous.png" alt="previous" />
        </button>
        <div>{{ formattedPayStubYear }}년 {{ formattedPayStubMonth }}월 급여명세서</div>
        <button @click="updateMonth(-1)" :disabled="month === 0">
          <img src="../../assets/image/next.png" alt="next" />
        </button>
      </div>
      <div class="employee">
        <div v-for="emp in employee" :key="emp.empId">
          <div>{{ emp.name }} </div>
          <div> | </div>
          <div> {{ emp.rrn }} </div>
          <div> | </div>
          <div> {{ emp.empId }} </div>
          <div> | </div>
          <div> {{ emp.deptName }} </div>
        </div>
      </div>
      <div class="pay-date">
        <div class="date">
          <h2>실수령액</h2>
          <div>{{ payStubDate }} 지급</div>
        </div>
        <p>{{ formatCurrency(payStub?.totalAmount) }}원</p>
      </div>
      <div class="pay-list">
        <h3>지급내역</h3>
        <div>{{ formatCurrency(payStub?.totalPayment) }}원</div>
      </div>
      <div class="pay">
        <h4>기본급</h4>
        <div>{{ formatCurrency(payStub?.pay) }}원</div>
      </div>
      <div class="over">
        <div class="date">
          <h4>초과수당</h4>
          <div>{{ formattedCountingDateStart }} ~ {{ formattedCountingDateEnd }} 내 집계</div>
        </div>
        <p>{{ formatCurrency(payStub?.totalOver ) }}원</p>
      </div>
      <div class="over-list">
        <div>
          <div class="all" v-if="payStub?.extendLaborAllowance > 0">
            <div class="allowance">
              <div>연장근무수당</div>
              <img src="../../assets/image/allowance.png" alt="allowance" />
<!--              <p>{{ calculateOvertimeHours(overtimeItem.overtimeStart, overtimeItem.overtimeEnd) }}시간</p>-->
            </div>
            <div>{{ formatCurrency(payStub?.extendLaborAllowance) }}원</div>
          </div>

          <div class="all" v-if="payStub?.nightLaborAllowance > 0">
            <div class="allowance">
              <div>야간근무수당</div>
              <img src="../../assets/image/allowance.png" alt="allowance" />
<!--              <p>{{ calculateOvertimeHours(overtimeItem.overtimeStart, overtimeItem.overtimeEnd) }}시간</p>-->
            </div>
            <div>{{ formatCurrency(payStub?.nightLaborAllowance) }}원</div>
          </div>

          <div class="all" v-if="payStub?.holidayLaborAllowance > 0">
            <div class="allowance">
              <div>휴일근무수당</div>
              <img src="../../assets/image/allowance.png" alt="allowance" />
<!--              <p>{{ calculateOvertimeHours(overtimeItem.overtimeStart, overtimeItem.overtimeEnd) }}시간</p>-->
            </div>
            <div>{{ formatCurrency(payStub?.holidayLaborAllowance) }}원</div>
          </div>
        </div>
        <div class="all" v-if="payStub?.annualAllowance > 0">
          <h5>연차수당</h5>
          <div>{{ formatCurrency(payStub?.annualAllowance) }}원</div>
        </div>
        <div class="all" v-if="payStub?.incentive > 0">
          <h5>성과급</h5>
          <div>{{ formatCurrency(payStub?.incentive) }}원</div>
        </div>
      </div>
      <div class="pay-list">
        <h3>공제내역</h3>
        <div>{{ formatCurrency(payStub?.totalDeduction) }}원</div>
      </div>
      <div class="pay">
        <h4>국민연금</h4>
        <div>{{ formatCurrency(payStub?.nationalPension) }}원</div>
      </div>
      <div class="pay">
        <h4>건강보험</h4>
        <div>{{ formatCurrency(payStub?.healthInsurance) }}원</div>
      </div>
      <div class="pay">
        <h4>고용보험</h4>
        <div>{{ formatCurrency(payStub?.hireInsurance) }}원</div>
      </div>
      <div class="pay">
        <h4>장기요양보험</h4>
        <div>{{ formatCurrency(payStub?.longTermCareInsurance) }}원</div>
      </div>
      <div class="pay">
        <h4>소득세</h4>
        <div>{{ formatCurrency(payStub?.incomeTax) }}원</div>
      </div>
      <div class="pay">
        <h4>지방소득세</h4>
        <div>{{ formatCurrency(payStub?.localIncomeTax) }}원</div>
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

.over {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 900px;
  margin-top: 10px;
  padding-bottom: 7px;
  border-bottom: 2px solid #888888;
}

.over h4 {
  color: #3C4651;
  font-weight: bold;
  font-size: 20px;
  margin: 0 20px 0 0;
}

.over div {
  color: #afa9a9;
  font-size: 15px;
  margin: 5px 0 0 0;
}

.over p {
  color: #3C4651;
  font-weight: bold;
  font-size: 20px;
  padding: 0;
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

.allowance div {
  color: #3C4651;
  font-size: 15px;
  margin: 0 20px 0 0 !important;
}

.allowance img {
  width: 40px;
  height: 20px;
  margin-right: 20px;
}

.allowance p {
  color: #afa9a9;
  margin: 0;
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

.all h5 {
  color: #3C4651;
  font-size: 15px;
  margin: 0;
}

</style>