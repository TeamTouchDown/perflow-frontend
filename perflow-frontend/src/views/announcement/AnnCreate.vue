<script setup>
import { ref } from "vue";
import api from "@/config/axios.js";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/authStore.js";
import FileUpload from "@/components/common/FileUpload.vue"; // FileUpload 컴포넌트 추가

const router = useRouter();

const announcement = ref({
  title: "",
  deptName: "",
  content: "",
});

const files = ref([]); // 파일 업로드 관리
const departments = ref([]); // 부서 목록 관리

const fetchDepartments = async () => {
  try {
    const response = await api.get("/departments/list");
    departments.value = response.data.map((dept) => ({
      id: dept.deptId, // 부서 ID 추가
      name: dept.name,
    }));
  } catch (error) {
    console.error("부서 목록 조회 실패", error);
  }
};

// FileUpload 컴포넌트로부터 파일 목록을 받아오는 핸들러
const handleFilesSelected = (uploadedFiles) => {
  files.value = uploadedFiles;
};

const saveAnnouncement = async () => {
  if (!announcement.value.title || !announcement.value.deptName || !announcement.value.content) {
    alert("모든 필드를 입력해주세요.");
    return;
  }

  try {
    const authStore = useAuthStore();
    const empId = authStore.empId;

    const selectedDept = departments.value.find((dept) => dept.name === announcement.value.deptName);
    const deptId = selectedDept ? selectedDept.id : null;

    if (!deptId) {
      alert("유효하지 않은 부서를 선택했습니다.");
      return;
    }

    const formData = new FormData();
    const dto = {
      deptId: deptId,
      empId: empId,
      title: announcement.value.title,
      content: announcement.value.content,
    };

    formData.append("announcementRequestDTO", JSON.stringify(dto));

    if (files.value.length > 0) {
      files.value.forEach((file) => {
        formData.append("files", file);
      });
    }

    console.log("FormData 데이터:");
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    await api.post("/announcements", formData);

    alert("공지사항이 성공적으로 생성되었습니다.");
    await router.push("/announcements");
  } catch (error) {
    console.error("공지사항 생성 실패", error);
    alert("공지사항 생성 중 문제가 발생했습니다.");
  }
};

fetchDepartments();
</script>

<template>
  <div id="announcement-create-container">
    <h1>공지사항</h1>

    <div class="form-group">
      <label for="title">제목 <span style="color: red;">*</span></label>
      <input
          id="title"
          v-model="announcement.title"
          type="text"
          placeholder="제목을 입력해주세요."
      />
    </div>

    <div class="form-group">
      <label for="deptName">부서 <span style="color: red;">*</span></label>
      <select id="deptName" v-model="announcement.deptName">
        <option value="" disabled>부서를 선택해주세요.</option>
        <option v-for="dept in departments" :key="dept.id" :value="dept.name">
          {{ dept.name }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="content">내용 <span style="color: red;">*</span></label>
      <textarea
          id="content"
          v-model="announcement.content"
          placeholder="내용을 입력해주세요."
      ></textarea>
    </div>

    <!-- FileUpload 컴포넌트 추가 -->
    <div class="form-group">
      <label>파일 첨부</label>
      <FileUpload
          mode="both"
          multiple
          buttonWidth="120px"
          buttonHeight="40px"
          width="100%"
          height="150px"
          @files-selected="handleFilesSelected"
      />
    </div>

    <div class="form-actions">
      <button @click="() => router.push('/announcements')">취소</button>
      <button @click="saveAnnouncement">작성</button>
    </div>
  </div>
</template>

<style scoped>
/* 전체 배경과 기본 설정 */
body {
  background-color: #f5f5f5; /* 페이지 배경 약간 회색 */
  margin: 0;
  padding: 0;
  font-family: 'Arial', sans-serif;
}

#announcement-create-container {
  max-width: 800px; /* 더 넓은 폼 */
  margin: 60px auto; /* 중앙 정렬 */
  padding: 40px; /* 내부 여백 */
  border: 1px solid #ddd; /* 박스 테두리 */
  border-radius: 12px; /* 모서리 둥글게 */
  background-color: #fff; /* 배경 흰색 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 더 깊은 그림자 */
}

h1 {
  text-align: left;
  margin-bottom: 30px;
  color: #333;
  font-size: 28px;
  font-weight: bold;
  border-bottom: 2px solid #ddd; /* 밑줄 추가 */
  padding-bottom: 10px; /* 밑줄과 텍스트 간격 */
}

/* 폼 그룹 */
.form-group {
  margin-bottom: 25px;
  display: flex;
  flex-direction: column;
}

label {
  font-size: 16px;
  font-weight: bold;
  color: #555;
  margin-bottom: 8px;
}

input,
select,
textarea {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #ffa500;
  outline: none;
  box-shadow: 0 0 4px rgba(255, 165, 0, 0.6);
}

textarea {
  height: 200px; /* 세로 길이 늘림 */
  resize: none;
}

/* 버튼 스타일 */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

button {
  padding: 12px 20px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:first-child {
  background-color: #d9d9d9; /* 취소 버튼 */
}

button:first-child:hover {
  background-color: #bfbfbf;
}

button:last-child {
  background: linear-gradient(to right, #ff9900, #ffcc33); /* 작성 버튼 */
}

button:last-child:hover {
  background: linear-gradient(to right, #e68a00, #e6b800);
}

/* 드롭다운 */
select {
  appearance: none; /* 기본 드롭다운 화살표 숨김 */
  background: url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3E%3Cpath fill='%23666' d='M2 0L0 2h4z'/%3E%3C/svg%3E") no-repeat right 10px center;
  background-size: 12px 12px;
  padding-right: 30px;
}
</style>
