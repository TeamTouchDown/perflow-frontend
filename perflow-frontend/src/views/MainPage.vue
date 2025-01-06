<script setup>
import {computed, onMounted, ref} from "vue";
import api from "@/config/axios.js";
import {useRouter} from "vue-router";
import On from "../assets/image/work_on.png";
import Off from "../assets/image/work_off.png";
import TableMini from "@/components/common/TableMini.vue";
import {useAuthStore} from "@/store/authStore.js";
import QRModal from "@/views/Attitude/Attendance/QRModal.vue";
import Luggage from "../assets/image/luggage.png";
import Beach from "../assets/image/beach.png";


// 상태 관리
const isModalVisible = ref(false);
const commuteEndTime = ref(null); // 퇴근 시간 기록

// 모달 데이터
const modalTitle = ref('');
const actionType = ref(''); // 출근(on) 또는 퇴근(off)

const router = useRouter();
const authStore = useAuthStore();
const employee = ref(null);
const attendance = ref([]);
const annual = ref(null);
const company = ref(null);
const vacation = ref([]);
const preAnnual = ref([]);
const teamKPI = ref([]);
const personalKPI = ref([]);
const announcement = ref(null);
const waitingApproval = ref(null);
const processedApproval = ref(null);

const diffDays = ref(0);
const waitingApprovalCount = ref(0);
const processedApprovalCount = ref(0);
const commuteStatus = ref('OFF');
const commuteStartTime = ref(null);
const commuteTime = ref(0); // 출퇴근 시간 차이 (분 단위로 계산됨)
const latest = ref({});
const year = ref(0);

const empId = authStore.empId;
const now = new Date() // 현재 날짜
year.value = now.getFullYear() // 현재 년도

// 사원 정보를 가져오는 함수
const fetchEmp = async () => {
  try {
    const response = await api.get(`/employees`);
    employee.value = response.data;
  } catch (error) {
    console.error('사원 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 일주일 총 근무시간 정보를 가져오는 함수
const fetchAttendance = async () => {
  try {
    const response = await api.get(`/emp/attendance/summaries/weekly`);
    attendance.value = response.data;

    // 데이터가 배열인지 확인
    if (Array.isArray(attendance.value) && attendance.value.length > 0) {
      // 가장 최근 주차 데이터 선택
      latest.value = attendance.value.sort((a, b) => b.period.localeCompare(a.period))[0];
      // console.log('가장 최근 주차 데이터:', latest);
    } else {
      console.warn('서버에서 유효한 데이터가 반환되지 않았습니다.', attendance.value);
    }
  } catch (error) {
    console.error('일주일 총 근무시간 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 연차 정보를 가져오는 함수
const fetchAnnual = async () => {
  try {
    const response = await api.get(`/emp/annual/balance`);
    annual.value = response.data;
  } catch (error) {
    console.error('연차 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 회사 정보를 가져오는 함수
const fetchPayDate = async () => {
  try {
    const response = await api.get(`/company`);
    company.value = response.data;  // 급여 지급일 (Unix timestamp)

    const paymentDay = company.value.paymentDatetime;  // 급여 지급일 (매월 10일, Integer 타입)

    // 현재 날짜 가져오기
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();  // 현재 연도
    const currentMonth = currentDate.getMonth();  // 현재 월 (0부터 시작, 0 = 1월)

    // 이번 달의 10일
    let paymentDate = new Date(currentYear, currentMonth, paymentDay);

    // 만약 오늘이 지급일 이후라면, 다음 달로 설정
    if (currentDate.getDate() > paymentDay) {
      paymentDate = new Date(currentYear, currentMonth + 1, paymentDay);  // 다음 달로 설정
    }

    // 현재 날짜와 급여 지급일의 차이 계산 (밀리초 단위)
    const diffTime = paymentDate - currentDate;

    // 밀리초를 일 단위로 변환
    diffDays.value = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;  // 결과를 diffDays에 저장

  } catch (error) {
    console.error('회사 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 휴가 정보를 가져오는 함수
const fetchVacation = async () => {
  try {
    const response = await api.get(`/emp/vacation/usage`);
    vacation.value = response.data;
  } catch (error) {
    console.error('휴가 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 예정 연차 데이터를 가져오는 함수
const fetchPreAnnual = async () => {
  try {
    const response = await api.get(`/emp/annual/list`);
    const currentDate = new Date();

    preAnnual.value = response.data
        .filter(item => {
          const annualStart = new Date(item.annualStart);
          return (
              item.status === 'CONFIRMED' && annualStart > currentDate
          );
        })
        .map(item => {
          const annualStart = new Date(item.annualStart);
          const annualEnd = new Date(item.annualEnd);

          const days = Math.ceil(
              (annualEnd - annualStart) / (1000 * 60 * 60 * 24)
          ) + 1;

          return {
            ...item,
            days,
          };
        });
  } catch (error) {
    console.error('예정 연차를 불러오는 중 에러가 발생했습니다: ', error);
  }
};

// 팀 kpi 정보를 가져오는 함수
const fetchTeamKPI = async () => {
  try {
    const response = await api.get(`/perfomances/kpi/team/period/current/${empId}/${year.value}`);
    teamKPI.value = response.data.kpiLists;
  } catch (error) {
    console.error('팀 kpi 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 개인 kpi 정보를 가져오는 함수
const fetchPersonalKPI = async () => {
  try {
    const response = await api.get(`perfomances/kpi/personal/period/current/${empId}/${year.value}`);
    personalKPI.value = response.data.kpiLists;
  } catch (error) {
    console.error('개인 kpi 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 공지사항 정보를 가져오는 함수
const fetchAnnouncement = async () => {
  try {
    // 1. 첫 번째 요청으로 페이지 정보만 가져옵니다 (페이지 번호와 전체 데이터 수)
    const pageResponse = await api.get(`/announcements`, {
      params: { size: 5 }  // 한 페이지에 표시할 데이터 수
    });

    // 2. 마지막 페이지 번호 가져오기
    const lastPage = pageResponse.data.totalPages - 1;

    // 3. 마지막 페이지의 데이터를 가져옵니다.
    const response = await api.get(`/announcements`, {
      params: {
        page: lastPage,  // 마지막 페이지
        size: 5         // 한 페이지에 표시할 데이터 수
      }
    });

    // 4. status가 'DELETED'가 아닌 항목만 필터링
    const filteredAnnouncements = response.data.content.filter(item => item.status !== 'DELETED');

    // 5. 최신순으로 정렬
    announcement.value = filteredAnnouncements.sort((a, b) => {
      const dateA = new Date(a.createDatetime);
      const dateB = new Date(b.createDatetime);
      return dateB - dateA; // 내림차순 정렬
    });

  } catch (error) {
    console.error('공지사항 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 대기 문서 정보를 가져오는 함수
const fetchWaitingApproval = async () => {
  try {
    const response = await api.get(`/approval/waiting-docs`);
    waitingApproval.value = response.data.content;
    // docId의 개수를 셈
    waitingApprovalCount.value = waitingApproval.value.filter(doc => doc.docId).length;
  } catch (error) {
    console.error('대기 문서 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

// 처리 문서 정보를 가져오는 함수
const fetchProcessedApproval = async () => {
  try {
    const response = await api.get(`/approval/processed-docs`);
    processedApproval.value = response.data.content;
    // docId의 개수를 셈
    processedApprovalCount.value = processedApproval.value.filter(doc => doc.docId).length;
  } catch (error) {
    console.error('처리 문서 정보를 불러오는 중 에러가 발생했습니다. : ', error);
  }
};

const goToKPI = () => {
  router.push(`/performance/kpi-current`)
};

const goToAnnouncement = () => {
  router.push(`/announcements`)
};

const goToApproval = () => {
  router.push(`/approval`)
};

const goToWaiting = () => {
  router.push(`/approval/waiting`)
};

const goToProcessed = () => {
  router.push(`/approval/processing`)
}

const kpiRows = computed(() => {
  // 팀 데이터와 개인 데이터를 합쳐서 하나의 배열로 반환
  const allData = [...teamKPI.value, ...personalKPI.value];

  // 진척도 계산 및 데이터 생성
  const mappedData = allData.map((item) => {
    const progress = item.goalValue > 0 ? (item.currentValue / item.goalValue) * 100 : 0;
    const category = item.personalType === "TEAM" ? "팀" : "개인";

    return {
      category: category,
      goal: item.goal,
      targetValue: `${item.goalValue}${item.goalValueUnit}`,
      progress: `${Math.round(progress)}%`,
    };
  });

  // '팀' 데이터가 위로 오도록 정렬
  return mappedData.sort((a, b) => {
    if (a.category === "팀" && b.category !== "팀") {
      return -1; // '팀'이 우선
    }
    if (a.category !== "팀" && b.category === "팀") {
      return 1; // '개인'이 나중
    }
    return 0; // 순서 유지
  });
});

const kpiColumns = [
  { field: 'category',    label: '구분' },
  { field: 'goal',        label: '제목' },
  { field: 'targetValue', label: '목표치' },
  { field: 'progress',    label: '진척도' }
];

const annRows = computed(() => {
  const ann = Array.isArray(announcement.value) ? announcement.value : [];
  return ann.map((item) => ({
    ...item,
    title: truncateTitle(item.title),
    createDatetime: formatDate(item.createDatetime),
  }));
});

// title이 10자 이상일 경우 ... 추가하는 함수
const truncateTitle = (title) => {
  return title.length > 8 ? title.substring(0, 8) + '...' : title;
};

// 날짜 포맷팅 함수
const formatDate = (dateString) => {
  return `${dateString.slice(0, 4)}.${dateString.slice(5, 7)}.${dateString.slice(8, 10)}`;
};

const annColumns = [
  { field: 'title',          label: '제목' },
  { field: 'deptName',       label: '부서명' },
  { field: 'createDatetime', label: '작성일' }
];

// 현재 날짜 표시
const currentDate = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
});

// 출퇴근 시간 계산
const formattedCommuteTime = computed(() => {
  const hours = Math.floor(commuteTime.value / 60);
  const minutes = commuteTime.value % 60;
  return `${hours}시간 ${minutes}분`;
});

console.log("formattedCommuteTime : ", formattedCommuteTime);

// 출근 시작 시간부터 현재 시간까지의 차이 계산
const calculateCommuteTime = () => {
  if (commuteStartTime.value) {
    const now = new Date();
    commuteTime.value = Math.floor((now - commuteStartTime.value) / (1000 * 60)); // 분 단위로 계산
  }
};

// 모달 열기
const openModal = (type) => {
  console.log('openModal 호출됨, type:', type);
  actionType.value = type; // 'on' 또는 'off'
  modalTitle.value = type === 'on' ? '출근 QR 인증 ' : '퇴근 QR 인증';
  isModalVisible.value = true;
};

// 모달 닫기
const closeModal = () => {
  isModalVisible.value = false;
};

let commuteInterval;

const confirmAction = () => {

  if (actionType.value === 'on') {
    // console.log('출근 처리 시작');
    commuteStatus.value = 'ON';
    // console.log("commuteStatus : ", commuteStatus.value);
    commuteStartTime.value = new Date(); // 출근 시간 기록
    // console.log('commuteStartTime:', commuteStartTime.value);

    commuteInterval = setInterval(calculateCommuteTime, 60000); // 1분마다 출퇴근 시간 계산

    // console.log('출근 완료!');
  } else if (actionType.value === 'off') {
    // console.log('퇴근 처리 시작');
    commuteStatus.value = 'OFF';
    // console.log("commuteStatus : ", commuteStatus.value);
    commuteEndTime.value = new Date(); // 퇴근 시간 기록
    commuteTime.value = 0; // 시간 초기화
    // console.log('commuteEndTime:', commuteEndTime.value);

    // 근무 시간 계산 (분 단위)
    const workMinutes = Math.floor(
        (commuteEndTime.value - commuteStartTime.value) / (1000 * 60)
    );
    // console.log(`퇴근 완료! 총 근무 시간: ${workMinutes}분`);

    // 퇴근 시 interval을 중지
    clearInterval(commuteInterval);
    commuteInterval = null;
  }
};

// 시간 기록을 문자열로 변환하여 시간만 표시하는 메서드
const formatTime = (time) => {
  if (!time) return '';
  const hours = time.getHours().toString().padStart(2, '0'); // 두 자리로 표시
  const minutes = time.getMinutes().toString().padStart(2, '0'); // 두 자리로 표시
  return `${hours}:${minutes}`;
};

onMounted(() => {

  // const isCheckedIn = localStorage.getItem('isCheckedIn') === 'true';
  // commuteStatus.value = isCheckedIn ? 'ON' : 'OFF';
  fetchEmp();
  fetchAttendance();
  fetchAnnual();
  fetchPayDate();
  // fetchVacation();
  fetchPreAnnual();
  fetchTeamKPI();
  fetchPersonalKPI();
  fetchAnnouncement();
  fetchWaitingApproval();
  fetchProcessedApproval();
});

</script>

<template>
  <div class="container">
    <!-- 프로필 및 출퇴근 정보 -->
    <div class="emp-info">
      <div class="emp">
        <h3>{{ employee?.deptName }}</h3>
        <div class="profile">
          <h2>{{ employee?.name }}</h2>
          <h4>{{ employee?.positionName }}</h4>
        </div>
      </div>
      <div class="commute">
        <h4>출퇴근</h4>
        <h5>{{ currentDate }}</h5>
        <div class="time">
          <img :src="commuteStatus === 'ON' ? On : Off" alt="commute status"/>
          <p>{{ formattedCommuteTime }}</p>
        </div>
        <div class="btn">
          <div class="button-container">
            <button
                :class="commuteStatus === 'ON' ? 'btn-gray' : 'btn-orange'"
                @click="openModal('on')"
                :disabled="commuteStatus === 'ON'"
            >
              ON<span v-if="commuteStatus === 'ON'">/{{ formatTime(commuteStartTime) }}</span>
            </button>
            <button
                :class="commuteStatus === 'OFF' ? 'btn-gray' : 'btn-orange'"
                @click="openModal('off')"
                :disabled="commuteStatus === 'OFF'"
            >
              OFF
            </button>
          </div>
        </div>
      </div>
    </div>
    <QRModal
      :isOpen="isModalVisible"
      :title="modalTitle"
      :type = "actionType"
      :confirmAction="confirmAction"
      @close="closeModal"
    />
    <!-- 근무시간, 남은 연차, 남은 급여일 정보 -->
    <div class="period">
      <div>
        <img src="../assets/image/alarm.png" alt="clock" />
        <h4>근무시간</h4>
        <p>{{ latest.totalHours }}시간 {{ latest.totalMinutes }}분</p>
      </div>
      <div>
        <img src="../assets/image/travel.png" alt="plane" />
        <h4>남은 연차</h4>
        <p>{{ annual }}일</p>
      </div>
      <div>
        <img src="../assets/image/payments.png" alt="money" />
        <h4>남은 급여일</h4>
        <p>{{ diffDays }}일전</p>
      </div>
    </div>
    <!-- 예정 휴가, kpi 정보 -->
    <div class="goal">
      <div class="vacation">
        <div class="vacation-title">
          <h2>예정 휴가</h2>
          <h3>{{  preAnnual.length }}</h3>
        </div>
        <div class="vacation-list" v-for="(item, index) in preAnnual" :key="index">
          <!-- 이미지 교차 출력 -->
          <img
              :src="index % 2 === 0 ? Luggage : Beach"
              :alt="index % 2 === 0 ? 'luggage' : 'beach'"
          />
          <p>연차</p>
          <h4>{{ new Date(item.annualStart).toLocaleDateString('ko-KR') }}</h4>
          <div class="vacation-box">
            <p>{{ item.days }}일</p>
          </div>
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-title">
          <Button @click="goToKPI">
            KPI
            <img src="../assets/image/left.png" alt="left"/>
          </Button>
        </div>
        <TableMini
            row-key="id"
            :rows="kpiRows"
            :columns="kpiColumns"
        />
      </div>
    </div>
    <!-- 공지사항, 결재문서 -->
    <div class="ann">
      <div class="announcement">
        <div class="announcement-title">
          <Button @click="goToAnnouncement">
            공지사항
            <img src="../assets/image/left.png" alt="left" />
          </Button>
        </div>
        <TableMini
            row-key="id"
            :rows="annRows"
            :columns="annColumns"
        />
      </div>
      <div class="approval">
        <div class="approval-title">
          <Button @click="goToApproval">
            결재문서
            <img src="../assets/image/left.png" alt="left" />
          </Button>
        </div>
        <div class="waiting">
          <div class="stat-item-a" @click="goToWaiting">
            <h4>대기문서</h4>
            <p>{{ waitingApprovalCount }}</p>
          </div>
          <div class="stat-item-b" @click="goToProcessed">
            <h4>처리문서</h4>
            <p>{{ processedApprovalCount }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 컨테이너 스타일 */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
}

/* 사원 정보 섹션 */
.emp-info {
  display: flex;
  justify-content: space-between;
  width: 900px;
  background-color: white;
  height: 250px;
}

.emp {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 300px;
}

.emp h3 {
  font-size: 24px;
  color: #afa9a9;
}

.profile {
  display: flex;
  margin-top: 10px;
}

.profile h2 {
  font-size: 30px;
  margin-right: 13px;
  color: #3C4651;
  font-weight: bold;
}

.profile h4 {
  font-size: 18px;
  color: #afa9a9;
  margin-top: 12px;
}

.commute {
  display: flex;
  flex-direction: column;
  width: 450px;
  background-color: white;
  border: 1px solid #afa9a9;
  border-radius: 10px;
}

.commute h4 {
  font-size: 20px;
  font-weight: bold;
  color: #3C4651;
  margin: 20px 0 10px 25px;
}

.commute h5 {
  font-size: 15px;
  color: #888888;
  margin-left: 25px;
}

.commute .time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin: 10px 0;
  height: 70px;
}

.time img {
  width: 30px;
  height: 20px;
  margin-bottom: 15px;
}

.time p {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #3C4651;
  font-weight: bold;
}

.btn {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin: 17px 50px 20px 50px;
  padding: 0;
}

.button-container {
  display: flex;
  align-items: center;
  gap: 25px;
}

.button-container p {
  font-size: 15px;
  font-weight: bold;
  color: #3C4651;
}

.btn-orange {
  width: 160px;
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

.btn-gray {
  width: 160px;
  height: 40px;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: bold;
  color: #3C4651;
  background-color: #D9D9D9;
  cursor: not-allowed;
}

/* 근무시간, 남은 연차, 남은 급여일 섹션 */
.period {
  display: flex;
  justify-content: space-between;
  width: 900px;
  gap: 30px;
  margin-top: 20px;
}

.period div {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  border: 1px solid #afa9a9;
  padding: 15px;
  height: 160px;
}

.period img {
  width: 30px;
  height: 30px;
  margin-bottom: 25px;
}

.period h4 {
  font-size: 13px;
  color: #afa9a9;
  margin-top: 15px;
}

.period p {
  font-size: 23px;
  color: #3C4651;
  margin: 0;
}

/* KPI 및 휴가 섹션 */
.goal {
  display: flex;
  justify-content: space-between;
  width: 900px;
  margin-top: 20px;
}

.vacation {
  display: flex;
  flex-direction: column;
  background-color: white;
  width: 400px;
  margin-top: 5px;
}

.vacation-title {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.vacation-title h2 {
  font-size: 25px;
  color: #3C4651;
  font-weight: bold;
  margin-right: 15px;
}

.vacation-title h3 {
  font-size: 25px;
  color: #05A730;
  font-weight: bold;
}

.vacation-list {
  display: flex;
  flex-direction: row;
  gap: 20px;
  margin-bottom: 15px;
}

.vacation-list img {
  width: 30px;
  height: 30px;
}

.vacation-list p {
  color: #3C4651;
  font-size: 20px;
  padding: 0;
  margin: 0;
}

.vacation-list h4 {
  color: #afa9a9;
  font-size: 20px;
  padding: 0;
  margin: 3px 0 0 0;
}

.vacation-box {
  border-radius: 10px;
  border: 1px solid #afa9a9;
  text-align: center;
  width: 55px;
  font-weight: bold;
}

.vacation ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.vacation li {
  margin: 5px 0;
  font-size: 20px;
  color: #3C4651;
}

.kpi {
  display: flex;
  flex-direction: column;
  background-color: white;
  width: 400px;
}

.kpi-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.kpi-title button {
  border: none;
  background: none;
  cursor: pointer;
  color: #3C4651;
  font-size: 25px;
  font-weight: bold;
  padding: 0;
}

.kpi-title img {
  width: 30px;
  height: 30px;
  margin-bottom: 5px;
}

/* 공지사항 및 결재문서 섹션 */
.ann {
  display: flex;
  justify-content: space-between;
  width: 900px;
  gap: 20px;
  margin-top: 20px;
  height: 400px;
}

.announcement {
  display: flex;
  flex-direction: column;
  background-color: white;
  width: 400px;
}

.announcement-title{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.announcement button {
  border: none;
  background: none;
  cursor: pointer;
  color: #3C4651;
  font-size: 25px;
  font-weight: bold;
  padding: 0;
}

.announcement img {
  width: 30px;
  height: 30px;
  margin-bottom: 5px;
}

.approval {
  display: flex;
  flex-direction: column;
  background-color: white;
  width: 400px;
}

.approval button {
  border: none;
  background: none;
  cursor: pointer;
  color: #3C4651;
  font-size: 25px;
  font-weight: bold;
  padding: 0;
}

.approval-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.approval img {
  width: 30px;
  height: 30px;
  margin-bottom: 5px;
}

.waiting {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.stat-item-a {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px 0 0 10px;
  padding: 15px;
  border: 1px solid #afa9a9;
  border-right: none; /* 오른쪽 테두리 제거 */
  height: 270px;
  cursor: pointer;
}

.stat-item-b {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 0 10px 10px 0;
  padding: 15px;
  border: 1px solid #afa9a9;
  height: 270px;
  cursor: pointer;
}

.stat-item h4 {
  font-size: 18px;
  color: #3C4651;
  font-weight: bold;
}

.stat-item-a p, .stat-item-b p {
  display: flex;
  flex-direction: row-reverse;
  margin-top: 143px;
  padding: 0;
  font-size: 50px;
  color: #F37321;
}
</style>