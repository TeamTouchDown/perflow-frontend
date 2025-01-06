<script setup>
import { ref } from 'vue';
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import { useRouter } from 'vue-router';
import Annual from '@/views/Attitude/Annual/Annual.vue';



const router = useRouter();

const categories = ref([
  {
    title: '연차 관리',
    description: '직원들의 연차 신청 및 관리를 할 수 있습니다.',
    features: ['연차 신청', '연차 현황 조회', '연차 승인/반려', '연차 사용 내역'],
    icon: '📅'
  },
  {
    title: '휴가 관리',
    description: '다양한 유형의 휴가를 신청하고 관리할 수 있습니다.',
    features: ['출산 휴가', '가족 돌봄 휴가', '생리 휴가', '배우자 출산 휴가'],
    icon: '🏖️'
  },
  {
    title: '출장 관리',
    description: '출장을 관리할 수 있습니다.',
    features: ['출장 신청', '출장 보고서', '출장 승인/반려', '출장 현황'],
    icon: '✈️'
  },
  {
    title: '초과근무 관리',
    description: '초과근무 신청 및 승인 처리를 관리할 수 있습니다.',
    features: ['초과근무 신청', '초과근무 승인/반려'],
    icon: '⏰'
  }
]);

const navigateToDetail = (category) => {
  // 각 카테고리별 상세 페이지로 이동하는 로직
  console.log(`Navigating to ${category} page`);
  if (category === '연차 관리') {
    router.push({ name: 'annual' });  // 연차 관리 페이지로 이동
  } else if (category === '휴가 관리') {
    router.push({ name: 'vacation' });  // 휴가 관리 페이지로 이동
  } else if (category === '출장 관리') {
    router.push({ name: 'travel' });  // 출장 관리 페이지로 이동
  } else if (category === '초과근무 관리') {
    router.push({ name: 'overtime' });  // 초과근무 관리 페이지로 이동
  }
};
</script>

<template>
  <div class="main-container">
    <div class="header-section">
      <h1 class="main-title">근태 홈</h1>
      <p class="subtitle">직원들의 근태를 효율적으로 관리하는 통합 플랫폼입니다.</p>
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