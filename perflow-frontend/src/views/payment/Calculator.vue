<script setup>
import {ref, onMounted, computed} from "vue";
import api from "@/config/axios.js";
import dayjs from "dayjs";

const employee = ref(null);
const resignDate = ref("");
const annualAllowance = ref(0);
const salaryData = ref([]);
const useSalaryTable = ref(true); // 테이블 입력

const totalDays = ref(0);
const totalPays = computed(() => {
  return salaryData.value.reduce((sum, item) => sum + item.pay, 0);
});

const totalExtraAllowance = computed(() => {
  return salaryData.value.reduce((sum, item) => sum + item.extraAllowance, 0);
});

// 계산 결과 저장 변수
const dailyAveragePay = ref(0);
const monthlyAveragePay = ref(0);
const totalSeverance = ref(0);

const handleRest = () => {
  resignDate.value = "";
  annualAllowance.value = 0;
  salaryData.value = [];
};

// 계산 함수
const calculate = () => {
  // 일 평균 급여 계산
  const totalDay = salaryData.value.reduce((sum, row) => sum + row.days, 0);
  const totalPay = salaryData.value.reduce((sum, row) => sum + row.pay, 0);
  const totalExtraAllowance = salaryData.value.reduce(
      (sum, row) => sum + row.extraAllowance, 0);

  dailyAveragePay.value = Math.round(
      (totalPay + totalExtraAllowance + annualAllowance.value * (3 / 12)) / totalDay
  );

  // 월 평균 급여 계산
  monthlyAveragePay.value = dailyAveragePay.value * 30;

  // 총 퇴직금 계산
  const daysWorked =
      dayjs(resignDate.value).diff(employee.value?.joinDate, "day") + 1;
  totalSeverance.value = Math.round(
      (monthlyAveragePay.value * daysWorked) / 365
  );
};

const generateSalaryTable = () => {
  const endDate = dayjs(resignDate.value); // 퇴사일 설정
  salaryData.value = [];
  totalDays.value = 0; // 총 일수 계산
  totalPays.value = 0; // 총 급여 계산
  totalExtraAllowance.value = 0; // 총 수당 계산

  // i = 0: 퇴사일 하루 전까지 포함된 월
  if(endDate.date() !== 1) {
    const periodEnd0 = endDate.subtract(1, "day"); // 퇴사일 하루 전
    const periodStart0 = periodEnd0.startOf("month"); // 퇴사일 하루 전이 포함된 월의 첫날
    const days0 = periodEnd0.diff(periodStart0, "day") + 1; // 퇴사일 하루 전까지의 기간

    totalDays.value += days0; // 총 일수에 더하기

    salaryData.value.unshift({
      period: `${periodStart0.format("YYYY.MM.DD")} ~ ${periodEnd0.format("YYYY.MM.DD")}`,
      days: days0,
      pay: 0,
      extraAllowance: 0,
    });
  }
  // i = 1, 2, 3: 퇴사일 전의 월들
  for (let i = 1; i < 4; i++) {

    const periodEnd = endDate.subtract(i, "month").endOf("month");
    let periodStart = periodEnd.startOf("month");

    // i = 3일 경우, periodStart는 퇴사일을 포함한 마지막 달의 첫날
    if (i === 3) {

      const resignDay = endDate.date(); // 퇴사일의 일
      periodStart = periodEnd.date(resignDay);

      // 월의 마지막 날을 계산해서 존재하지 않는 날짜로 넘어가지 않도록 처리
      if (endDate.date() > periodEnd.date()) {
        periodStart = periodEnd.endOf('month');
      }

    }

    const days = periodEnd.diff(periodStart, "day") + 1; // 기간의 총 일수

    totalDays.value += days; // 총 일수에 더하기
    salaryData.value.unshift({
      period: `${periodStart.format("YYYY.MM.DD")} ~ ${periodEnd.format("YYYY.MM.DD")}`,
      days,
      pay: 0,
      extraAllowance: 0,
    });
  }

  // pay와 extraAllowance 합계 계산
  totalPays.value = salaryData.value.reduce((sum, item) => sum + item.pay, 0);
  totalExtraAllowance.value = salaryData.value.reduce((sum, item) => sum + item.extraAllowance, 0);
};

// 사원 정보를 가져오는 함수
const fetchEmp = async () => {
  try {
    const response = await api.get(`/employees`);
    employee.value = response.data;
  } catch (error) {
    console.log('사원 정보를 불러오는 중 에러가 발생했습니다. : ',error);
  }
};

// 금액 포맷 함수
const formatCurrency = (value) => {
  if (!value) return '0';
  return value.toLocaleString(); // 천 단위 ',' 추가
};

onMounted(() => {
  fetchEmp();
});
</script>

<template>
  <div class="container">
    <div class="title">
      <p>예상 퇴직금 계산기</p>
      <button
          class="btn"
          @click="handleRest"
      >
        초기화
      </button>
    </div>
    <div class="date">
      <div class="join">
        <p>입사일</p>
        <div class="join-date">
          {{ employee?.joinDate }}
          <img src="../../assets/image/calendar.png" alt="calendar" />
        </div>
      </div>
      <div class="join">
        <p>퇴사일</p>
        <input
          class="date-input"
          type="date"
          v-model="resignDate"
          @change="generateSalaryTable"
        />
      </div>
    </div>
    <div class="allowance">
      <p>기타 수당(선택)</p>
      <div class="annual-allowance">
        <p>연차수당</p>
        <input
            class="annual-input"
            type="number"
            v-model.number="annualAllowance"
        /> <p style="margin:0 0 0 10px">원</p>
      </div>
    </div>
    <div class="pay-title">
      <p>최종월급(세전)</p>
      <div v-if="useSalaryTable" class="pay-table">
        <table>
          <thead>
            <tr>
              <th>기간</th>
              <th>기간별일수</th>
              <th>기본급</th>
              <th>기타수당</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in salaryData" :key="index">
              <td>{{ row.period }}</td>
              <td>{{ row.days }}일</td>
              <td><input type="number" v-model.number="row.pay"/>원</td>
              <td><input type="number" v-model.number="row.extraAllowance"/>원</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="total-title">합계</td>
              <td>{{ totalDays }}일</td>
              <td>{{ formatCurrency(totalPays) }}원</td>
              <td>{{ formatCurrency(totalExtraAllowance) }}원</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="calculation-btn">
        <button
            class="btn"
            @click="calculate"
        >
          계산하기
        </button>
      </div>
    </div>
    <div class="average-pay">
      <div class="monthly">
        <p>1개월 평균임금</p>
        <p>{{ formatCurrency(monthlyAveragePay) }}원</p>
      </div>
      <div class="daily">
        <p>1일 평균임금</p>
        <p>{{ formatCurrency(dailyAveragePay) }}원</p>
      </div>
      <div class="severance">
        <p>퇴직금</p>
        <p>{{ formatCurrency(totalSeverance) }}원</p>
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

.title {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 900px;
  margin-top: 30px;
}

.title p {
  color: #3C4651;
  font-size: 35px;
  font-weight: bold;
  margin: 0;
}

.btn {
  width: 80px;
  height: 40px;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: bold;
  color: white;
  background-image: linear-gradient(to right, #f37321 0%, #fb0 100%);
}

.date {
  width: 900px;
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  margin: 50px;
}

.join {
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 30px;
}

.join p {
  font-size: 25px;
  color: #3C4651;
  margin: 0;
}

.join-date {
  align-content: center;
  width: 200px;
  height: 30px;
  border: 1px solid #afa9a9;
  border-radius: 10px;
  padding-left: 10px;
  color: #afa9a9;
}

.join-date img {
  width: 25px;
  height: 25px;
  margin-left: 70px;
}

.date-input {
  width: 200px;
  height: 30px;
  border: 1px solid #afa9a9;
  border-radius: 10px;
  font-size: 16px;
  color: #3C4651;
  padding-left: 10px;
}

.allowance {
  display: flex;
  flex-direction: column;
  width: 900px;
}

.allowance p {
  font-size: 28px;
  color: #3C4651;
  font-weight: bold;
}

.annual-allowance {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 10px;
}

.annual-allowance p {
  font-size: 25px !important;
  font-weight: normal !important;
  margin: 0 30px 0 0;
}

.annual-input {
  font-size: 20px;
  color: #3C4651;
  border: 1px solid #afa9a9;
  border-radius: 10px;
  align-content: center;
  text-align: right;
  width: 200px;
  height: 30px;
  padding: 0;
}

.pay-title {
  width: 900px;
  margin-top: 50px;
}

.pay-title p {
  font-size: 28px;
  color: #3C4651;
  font-weight: bold;
  margin: 0;
}

.pay-table {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 900px;
  table-layout: fixed;
  margin-top: 30px;
  border: 1px solid #AFA9A9; /* 바깥 테두리 색상 */
  border-radius: 10px;
  overflow: hidden; /* 테두리 안쪽 내용 잘림 방지 */
}

th,
td {
  text-align: center; /* 텍스트 가운데 정렬 */
  vertical-align: middle; /* 세로 가운데 정렬 */
  font-size: 16px;
  border-bottom: 1px solid #AFA9A9;
}
th, .total-title {
  color: #3C4651;
  font-weight: bold;
  width: 225px;
}

td {
  color: #3C4651;
}

td > input {
  color: #3C4651;
  width: 120px;
  text-align: right;
  margin-right: 10px;
  border: none;
}

.calculation-btn {
  display: flex;
  flex-direction: row-reverse;
  margin-top: 30px;
}

.average-pay {
  width: 900px;
  margin-top: 50px;
  color: #3C4651;
}

.monthly, .daily {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.monthly p, .daily p {
  font-size: 25px;
  margin: 0;
}

.severance {
  display: flex;
  justify-content: space-between;
  font-size: 35px;
  font-weight: bold;
  margin: 0;
}

</style>