<script setup>
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import {onMounted} from "vue";

defineProps({
  title: { type: String, required: true }, // 결재선, 공유
  placeholder: { type: String, required: true }, // 비어있을 때 표시할 메시지
  data: { type: Array, default: () => [] }  // 결재선 데이터
});

const emit = defineEmits(["onSettingsClick"]);

</script>

<template>
  <div class="box-wrapper">
    <!-- 제목 -->
    <div class="box-title">
      <span>{{ title }}</span>
      <i
          class="bi bi-question-circle"
          data-bs-toggle="tooltip"
          title="설정 방법 안내"
      ></i>
    </div>

    <!-- 박스 컨테이너 -->
    <div class="box-container">
      <!-- 설정 버튼 -->
      <div class="box-header">
        <ButtonBasic
            color="white"
            size="small"
            label="설정"
            @click="emit('onSettingsClick')"
        />
      </div>

      <!-- 데이터 표시 -->
      <div v-if="data.length > 0" class="box-content">
        <div class="approval-item" v-for="(item, index) in data" :key="index">
          <span class="approval-type" :class="item.type || 'default-type'"
          >
            {{ item.type || '공유' }}
          </span>
          <span class="approval-name">{{ item.name }}</span>
          <span class="approval-position">{{ item.position }}</span>
        </div>
      </div>

      <!-- 비어있을 때 표시 -->
      <div class="box-empty">
        {{ placeholder }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.box-wrapper {
  position: relative;
  margin-bottom: 20px;
}

/* 제목 스타일 */
.box-title {
  position: relative;
  top: -10px; /* 박스 바로 위로 이동 */
  left: 0;
  margin-left: 5px;
  font-size: 14px;
  font-weight: bold;
  color: #3C4651;
  display: flex;
  align-items: center;
}

.box-title .bi-question-circle {
  margin-left: 5px;
  cursor: pointer;
  color: #6c757d;
}

/* 박스 컨테이너 */
.box-container {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 15px;
  width: 300px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center; /* 수평 중앙 정렬 */
  justify-content: center; /* 수직 중앙 정렬 */
  position: relative; /* 상대 위치 설정 */
  min-height: 150px; /* 최소 높이 설정 */
}

/* 설정 버튼 */
.box-header {
  position: absolute;
  top: 10px;
  right: 10px; /* 설정 버튼을 상단 우측에 배치 */
}

.box-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.approval-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;  /* 내부 여백 */
  border-radius: 10px;
  background-color: #ffffff;
  border: 0.5px solid #D9D9D9;
  /* box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); */
  font-size: 13px;
  width: 160px;
}

.approval-type {
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 12px;
  color: white;
  font-size: 12px;
}

.approval-type.동의,
.approval-type.합의 {
  color: #28a745; /* 초록색 */
  border: 1px solid #28a745;
}

.approval-type.참조 {
  color: #ff8c00; /* 주황색 */
  border: 1px solid #ff8c00; /* 주황색 */
}

.approval-type.병렬,
.approval-type.병렬합의 {
  color: #007bff; /* 파란색 */
  border: 1px solid #007bff; /* 파란색 */
}

.approval-type.공유 {
  color: #bd76f8; /* 회색 배경 */
  border: 1px solid #bd76f8;
}

.approval-name {
  font-weight: bold;
}

.approval-position {
  color: #6c757d;
}

/* 비어있을 때 메시지 */
.box-empty {
  color: #a0a0a0;
  font-size: 14px;
  text-align: center;
}

.approval-type.default-type {
  color: #bd76f8; /* 회색 배경 */
  border: 1px solid #bd76f8;
}
</style>