<script setup>
import { ref, onMounted } from "vue";
import api from "@/config/axios.js";
import { useRoute, useRouter } from "vue-router";
import FileUpload from "@/components/common/FileUpload.vue";

const route = useRoute();
const router = useRouter();

const annId = ref(route.params.annId); // 현재 공지사항 ID
const announcement = ref({
  title: "",
  deptName: "",
  content: "",
});
const files = ref([]); // 현재 파일 목록
const newFiles = ref([]); // 새로 추가된 파일 목록
const deletedFileIds = ref([]); // 삭제된 파일 ID
const departments = ref([]); // 부서 목록

// 부서 목록 가져오기
const fetchDepartments = async () => {
  try {
    const response = await api.get("/departments/list");
    departments.value = response.data.map((dept) => ({
      id: dept.deptId,
      name: dept.name,
    }));
  } catch (error) {
    console.error("부서 목록 조회 실패", error);
  }
};

// 기존 공지사항 데이터 가져오기
const fetchAnnouncement = async () => {
  try {
    const response = await api.get(`/announcements/${annId.value}`);
    const data = response.data;

    announcement.value = {
      title: data.title,
      deptName: data.deptName,
      content: data.content,
    };
  } catch (error) {
    console.error("공지사항 데이터 조회 실패", error);
    alert("공지사항 데이터를 불러오는 데 실패했습니다.");
    router.push("/announcements");
  }
};

// 파일 데이터 가져오기
const fetchFiles = async () => {
  try {
    const response = await api.get(`/files/announcement/${annId.value}`);
    const data = response.data;

    // 파일 데이터 로드
    files.value = Array.isArray(data)
        ? data.map((file) => ({
          id: file.id, // DTO의 id 필드를 그대로 사용
          originName: file.originName,
          url: file.url,
        }))
        : [];

    // 파일 ID 로그 출력
    files.value.forEach((file) => {
      console.log(`로드된 파일 ID: ${file.id}, 파일명: ${file.originName}`);
    });
  } catch (error) {
    console.error("파일 데이터 조회 실패", error);
  }
};

// FileUpload 컴포넌트로부터 파일 목록을 받아오는 핸들러
const handleFilesSelected = (uploadedFiles) => {
  newFiles.value = uploadedFiles;
};

// 파일 삭제
const removeFile = (fileId) => {
  console.log("삭제 요청 파일 ID:", fileId); // 디버깅용 로그

  // 파일의 인덱스를 찾고 삭제 처리
  const fileIndex = files.value.findIndex((file) => file.id === fileId);
  if (fileIndex !== -1) {
    deletedFileIds.value.push(files.value[fileIndex].id); // 삭제 ID 추가
    files.value.splice(fileIndex, 1); // 파일 목록에서 제거
    console.log("삭제된 파일 ID 목록:", deletedFileIds.value);
  } else {
    console.warn(`파일 ID ${fileId}를 찾을 수 없습니다.`);
  }
};

// 공지사항 수정 요청
const updateAnnouncement = async () => {
  if (!announcement.value.title || !announcement.value.deptName || !announcement.value.content) {
    alert("모든 필드를 입력해주세요.");
    return;
  }

  try {
    const selectedDept = departments.value.find((dept) => dept.name === announcement.value.deptName);
    const deptId = selectedDept ? selectedDept.id : null;

    if (!deptId) {
      alert("유효하지 않은 부서를 선택했습니다.");
      return;
    }

    const formData = new FormData();
    const dto = {
      deptId: deptId,
      title: announcement.value.title,
      content: announcement.value.content,
    };

    formData.append("announcementRequestDTO", JSON.stringify(dto));

    // 추가된 파일 추가
    if (newFiles.value.length > 0) {
      newFiles.value.forEach((file) => formData.append("addedFiles", file));
    }

    // 삭제된 파일 ID 추가
    if (deletedFileIds.value.length > 0) {
      deletedFileIds.value.forEach((fileId) => formData.append("deletedFileIds", fileId));
    }

    console.log("전송 데이터 확인:");
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    await api.put(`/announcements/${annId.value}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    alert("공지사항이 성공적으로 수정되었습니다.");
    router.push("/announcements");
  } catch (error) {
    console.error("공지사항 수정 실패:", error);
    alert("공지사항 수정 중 문제가 발생했습니다.");
  }
};

// 취소 버튼
const cancelUpdate = () => {
  router.push("/announcements");
};

// 초기 데이터 로드
onMounted(() => {
  fetchDepartments();
  fetchAnnouncement();
  fetchFiles();
});
</script>

<template>
  <div id="announcement-edit-container">
    <h1>공지사항 수정</h1>

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

    <!-- 기존 파일 목록 -->
    <div class="form-group">
      <label>기존 첨부파일</label>
      <ul>
        <li v-for="file in files" :key="file.id">
          📎
          <span
              class="file-link"
          >
        {{ file.originName }}
      </span>
          <button @click="removeFile(file.id)" class="remove-file-btn">삭제</button>
        </li>
      </ul>
    </div>

    <!-- 새 파일 업로드 -->
    <div class="form-group">
      <label>새 파일 추가</label>
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
      <button @click="cancelUpdate">취소</button>
      <button @click="updateAnnouncement">수정</button>
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

#announcement-edit-container {
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

.remove-file-btn {
  margin-left: 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px;
}

.remove-file-btn:hover {
  background-color: #c82333;
}

.file-link {
  color: #333; /* 일반 텍스트 색상 */
  cursor: pointer;
  text-decoration: none;
}
</style>
