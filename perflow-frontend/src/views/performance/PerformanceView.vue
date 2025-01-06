<script setup>
import {ref} from 'vue';
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import {useRouter} from 'vue-router';


const router = useRouter();

const categories = ref([
  {
    title: '개인 KPI 제출',
    description: '개인의 KPI를 제출,수정 할 수 있습니다.',
    features: ['기간별 KPI 신청', '기간별 KPI 수정', '승인 대기, 반려 중인 KPI 확인'],
  },
  {
    title: '팀 KPI 제출',
    description: '팀의 KPI를 제출,수정 할 수 있습니다.',
    features: ['기간별 KPI 신청', '기간별 KPI 수정', '승인 대기, 반려 중인 KPI 확인'],
  },
  {
    title: '동료 평가 작성',
    description: '동료에 대한 평가를 작성할 수 있습니다.',
    features: ['동료 평가 작성', '평가 대기중인 항목 확인'],
  },
  {
    title: '하향 평가 작성',
    description: '팀장이 팀원에 대한 평가를 작성할 수 있습니다.',
    features: ['하향 평가 작성', '평가 대기중인 항목 확인'],
  },
  {
    title: '인사 평가 조회',
    description: '최근 및 이전의 인사평가를 조회할 수 있습니다.',
    features: ['최근 인사평가 조회', '과거 인사평가 조회'],
  },
  {
    title: 'KPI 현황 관리',
    description: '현재 진행중인 KPI의 진척도를 관리할 수 있습니다.',
    features: ['현재 진행중인 KPI 기간별 확인', 'KPI 진척도 최신화'],
  },
  {
    title: 'KPI 기록 조회',
    description: '과거 진행했던 KPI를 열람하여 업무에 참고할 수 있습니다.',
    features: ['기간별 과거 KPI 조회'],
  },
  {
    title: '평가 조정',
    description: '사원들의 평가를 통한 평가 점수 조정을 할 수 있습니다.',
    features: ['평가 열람', '평가 점수 조정'],
  },
  {
    title: 'KPI 승인',
    description: '사원들이 신청한 KPI를 승인, 반려 할 수 있습니다.',
    features: ['KPI 승인', 'KPI 반려'],
  },
  {
    title: '평가 문항 관리',
    description: '동료, 하향 평가에 사용될 문항을 관리할 수 있습니다.',
    features: ['부서별 문항 추가', '부서별 문항 수정'],
  },
  {
    title: '부서별 가중치 설정',
    description: '부서별 각 평가의 가중치를 설정할 수 있습니다.',
    features: ['부서별 평가 가중치 설정'],
  },
  {
    title: '회사 등급 비율 설정',
    description: '회사의 인사평가 등급 비율을 설정할 수 있습니다.',
    features: ['인사평가 등급 비율 설정'],
  }
]);

const navigateToDetail = (category) => {
  // 각 카테고리별 상세 페이지로 이동하는 로직
  console.log(`Navigating to ${category} page`);
  if (category === '개인 KPI 제출') {
    router.push({name: 'personalKPI'});  // 연차 관리 페이지로 이동
  } else if (category === '팀 KPI 제출') {
    router.push({name: 'teamKPI'});  // 휴가 관리 페이지로 이동
  } else if (category === '동료 평가 작성') {
    router.push({name: 'peerEvaluation'});  // 출장 관리 페이지로 이동
  } else if (category === '하향 평가 작성') {
    router.push({name: 'downwardEvaluation'});  // 초과근무 관리 페이지로 이동
  } else if (category === '인사 평가 조회') {
    router.push({name: 'evaluationList'});  // 휴가 관리 페이지로 이동
  } else if (category === 'KPI 현황 관리') {
    router.push({name: 'KPIUpdate'});  // 출장 관리 페이지로 이동
  } else if (category === 'KPI 기록 조회') {
    router.push({name: 'KPIRecord'});  // 초과근무 관리 페이지로 이동
  } else if (category === '평가 조정') {
    router.push({name: 'evaluationAdjustment'});  // 휴가 관리 페이지로 이동
  } else if (category === 'KPI 승인') {
    router.push({name: 'kpiConfirm'});  // 출장 관리 페이지로 이동
  } else if (category === '평가 문항 관리') {
    router.push({name: 'questionManagement'});  // 초과근무 관리 페이지로 이동
  } else if (category === '부서별 가중치 설정') {
    router.push({name: 'deptRatio'});  // 휴가 관리 페이지로 이동
  } else if (category === '회사 등급 비율 설정') {
    router.push({name: 'gradeRatio'});  // 출장 관리 페이지로 이동
  }
};
</script>

<template>
  <div class="main-container">
    <div class="header-section">
      <h1 class="main-title">인사 평가 시스템</h1>
      <p class="subtitle">직원들의 성과를 효율적으로 관리할 수 있는 시스템입니다.</p>
    </div>

    <div class="cards-container">
      <div v-for="category in categories"
           :key="category.title"
           class="category-card">
        <div class="card-header">
          <span class="card-icon">{{ category.icon }}</span>
          <h2 class="card-title">{{ category.title }}</h2>
        </div>
        <p class="card-description">{{ category.description }}</p>
        <ul class="feature-list">
          <li v-for="feature in category.features"
              :key="feature"
              class="feature-item">
            {{ feature }}
          </li>
        </ul>
        <ButtonBasic
            color="orange"
            size="medium"
            :label="`${category.title} 바로가기`"
            @click="navigateToDetail(category.title)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  max-width: 1200px;
  margin: 50px auto;
  padding: 0 20px;
}

.header-section {
  text-align: center;
  margin-bottom: 50px;
}

.main-title {
  font-size: 35px;
  font-weight: bold;
  color: #3C4651;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 18px;
  color: #666;
  margin-bottom: 30px;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  padding: 20px 0;
}

.category-card {
  background: white;
  border: 1px solid #AFA9A9;
  border-radius: 10px;
  padding: 25px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.card-icon {
  font-size: 24px;
  margin-right: 10px;
}

.card-title {
  font-size: 20px;
  font-weight: bold;
  color: #3C4651;
  margin: 0;
}

.card-description {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.feature-item {
  padding: 8px 0;
  color: #555;
  position: relative;
  padding-left: 20px;
}

.feature-item::before {
  content: "•";
  color: #f37321;
  position: absolute;
  left: 0;
}
</style>