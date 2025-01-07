<script setup>
import { ref } from 'vue';
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  mode: {
    type: String,
    default: 'both', // 'select', 'drag', or 'both'
  },
  multiple: {
    type: Boolean,
    default: true, // 다중 파일 선택 허용 여부
  },
  // 파일 선택 버튼 크기
  buttonWidth: {
    type: String,
    default: '120px', // 기본 너비
  },
  buttonHeight: {
    type: String,
    default: '45px', // 기본 높이
  },
  // 드래그 앤 드롭 영역 크기 사용자 지정
  width: {
    type: String,
    default: '400px', // 기본값: 부모 컴포넌트에 따라 유동적
  },
  height: {
    type: String,
    default: '150px', // 기본 높이
  },
});

const emit = defineEmits(['files-selected']); // 부모 컴포넌트에 파일 이벤트 전달

const selectedFiles = ref([]);

// 파일 선택 핸들러
const handleFileSelect = (event) => {
  const files = event.target.files;
  updateFiles([...files]);
};

// 드래그 앤 드롭 핸들러
const handleDrop = (event) => {
  event.preventDefault();
  const files = event.dataTransfer.files;
  updateFiles([...files]);
};

// 드래그 이벤트 방지
const preventDefault = (event) => {
  event.preventDefault();
};

// 파일 업데이트 및 이벤트 emit
const updateFiles = (files) => {
  selectedFiles.value = files;
  emit('files-selected', files);
};

const deleteFiles = (index) => {
  selectedFiles.value.pop(index);
}
</script>

<template>
  <div>
    <!-- 파일 선택 모드 -->
    <div v-if="mode === 'select' || mode === 'both'">
      <label
          for="file-upload"
          class="upload-button"
          :style="{ width: buttonWidth, height: buttonHeight }"
      >
        파일 선택
      </label>
      <input
          id="file-upload"
          type="file"
          :multiple="multiple"
          hidden
          @change="handleFileSelect"
      />
    </div>

    <!-- 드래그 앤 드롭 모드 -->
    <div
        v-if="mode === 'drag' || mode === 'both'"
        class="drop-area"
        :style="{ width: width, height: height }"
        @dragover="preventDefault"
        @dragenter="preventDefault"
        @drop="handleDrop"
    >
      <p class="drop-area-content" v-if="selectedFiles.length === 0">
        <img src="../../assets/image/upload.png" alt="업로드" />
        파일을 여기에 드래그 앤 드롭하세요.
      </p>
      <!-- 선택된 파일 목록 -->
      <ul v-if="selectedFiles.length">
        <li v-for="(file, index) in selectedFiles" :key="index" class="upload-file-name">
          {{ file.name }} <img src="@/assets/image/delete.png" alt="삭제버튼" class="delete-image" @click="deleteFiles(index)">
        </li>
      </ul>
    </div>


  </div>
</template>

<style scoped>
.upload-button {
  display: flex; /* 플렉스 컨테이너 설정 */
  align-items: center; /* 수직 중앙 정렬 */
  justify-content: center; /* 수평 중앙 정렬 */
  padding: 0; /* 플렉스 정렬을 방해하지 않도록 패딩 제거 */
  background-color: #ffffff;
  color: #3c4651;
  text-align: center;
  border: 1px solid #afa9a9;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
  font-size: 16px; /* 글자 크기 */
  font-weight: bold;
}

.drop-area {
  border: 2px dashed #afa9a9;
  border-radius: 5px;
  display: flex; /* 중앙 정렬 */
  align-items: center; /* 수직 중앙 정렬 */
  justify-content: center; /* 수평 중앙 정렬 */
  text-align: center;
  color: #afa9a9;
  font-weight: bold;
  margin-top: 10px;
  font-size: 16px;
  transition: background-color 0.3s;
}

.drop-area:hover {
  background-color: #f8f9fa;
}

.drop-area-content {
  display: flex;
  flex-direction: row; /* 이미지와 텍스트를 세로로 배치 */
  align-items: center; /* 이미지와 텍스트 수평 중앙 정렬 */
  justify-content: center;
  gap: 10px; /* 이미지와 텍스트 사이 간격 */
}

.drop-area img {
  width: 30px; /* 기본 크기 */
  height: 30px;
}

ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 20px;
}

li {
  margin: 5px 0;
}

.upload-file-name {
  color: #3c4651;
}
.delete-image {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
</style>
