<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/config/axios.js";
import { useAuthStore } from "@/store/authStore.js";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore(); // Pinia 스토어 사용

const annId = ref(Number(route.params.annId)); // 현재 공지사항 ID
const announcement = ref(null); // 공지사항 데이터
const files = ref([]); // 파일 데이터
const prevAnnouncement = ref(null); // 이전 글
const nextAnnouncement = ref(null); // 다음 글
const announcementsList = ref([]); // 전체 공지사항 리스트

// 공지사항 데이터 가져오기
const fetchAnnouncement = async () => {
  try {
    const response = await api.get(`/announcements/${annId.value}`);
    const data = response.data;

    // 공지사항 데이터 설정
    announcement.value = {
      annId: data.annId,
      title: data.title,
      content: data.content,
      deptName: data.deptName,
      empName: data.empName,
      empId: data.empId, // 작성자 ID
      createDatetime: data.createDatetime,
      updateDatetime: data.updateDatetime,
    };
  } catch (error) {
    console.error("공지사항 데이터를 불러오는 데 실패했습니다.", error);
  }
};

// 공지사항 리스트 가져오기
const fetchAnnouncementsList = async () => {
  try {
    const response = await api.get(`/announcements`, {
      params: {
        page: 0,
        size: 100, // 필요한 만큼 가져오기
        sort: "annId,asc", // 정렬 기준 (오름차순)
      },
    });

    announcementsList.value = response.data.content;

    // 이전글/다음글 계산
    calculatePrevAndNext();
  } catch (error) {
    console.error("공지사항 리스트를 불러오는 데 실패했습니다.", error);
  }
};

// 이전글/다음글 계산
const calculatePrevAndNext = () => {
  const currentIndex = announcementsList.value.findIndex(
      (item) => item.annId === annId.value
  );

  if (currentIndex > 0) {
    prevAnnouncement.value = announcementsList.value[currentIndex - 1];
  } else {
    prevAnnouncement.value = null; // 이전글 없음
  }

  if (currentIndex < announcementsList.value.length - 1) {
    nextAnnouncement.value = announcementsList.value[currentIndex + 1];
  } else {
    nextAnnouncement.value = null; // 다음글 없음
  }
};

// 파일 데이터 가져오기
const fetchFiles = async () => {
  try {
    const response = await api.get(`/files/announcement/${annId.value}`);
    files.value = response.data;
  } catch (error) {
    console.error("파일 데이터를 불러오는 데 실패했습니다.", error);
  }
};

// 로그인 사용자가 작성자인지 확인
const isAuthor = computed(() => {
  return authStore.empId === announcement.value?.empId;
});

// 목록으로 이동
const goToList = () => {
  router.push("/announcements");
};

// 공지사항 수정
const editAnnouncement = () => {
  router.push(`/announcements/${annId.value}/edit`);
};

// 공지사항 삭제
const deleteAnnouncement = async () => {
  if (confirm("정말로 삭제하시겠습니까?")) {
    try {
      // DELETE 요청 시 Authorization 헤더에 토큰 포함
      await api.delete(`/announcements/${annId.value}`, {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`, // 현재 로그인 사용자의 토큰
        },
      });

      alert("삭제되었습니다.");
      goToList(); // 삭제 후 목록으로 이동
    } catch (error) {
      console.error("공지사항 삭제 실패:", error);

      // 토큰 만료나 인증 관련 에러 처리
      if (error.response?.status === 401) {
        alert("로그인이 만료되었습니다. 다시 로그인 해주세요.");
        authStore.logout(); // 로그아웃 처리
      } else if (error.response?.status === 403) {
        alert("삭제 권한이 없습니다.");
      } else {
        alert("공지사항 삭제에 실패했습니다.");
      }
    }
  }
};

const downloadFile = async (fileId, fileName) => {
  try {
    const response = await api.get(`/files/download/${fileId}`, {
      responseType: "blob", // 바이너리 데이터를 처리하기 위한 설정
    });

    // 브라우저에서 다운로드 실행
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName); // 파일 이름 설정
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("파일 다운로드 실패:", error);
    alert("파일 다운로드 중 문제가 발생했습니다.");
  }
};

// 라우트 변경 감지
watch(
    () => route.params.annId,
    async (newAnnId) => {
      annId.value = Number(newAnnId); // annId 업데이트
      await fetchAnnouncement(); // 새 공지사항 데이터 가져오기
      await fetchAnnouncementsList(); // 새 리스트 데이터 가져오기
      await fetchFiles(); // 새 파일 데이터 가져오기
    }
);

const goToUpdatePage = () => {
  router.push(`/announcements/update/${annId.value}`);
};

// 초기 데이터 로드
onMounted(async () => {
  await fetchAnnouncement();
  await fetchAnnouncementsList();
  await fetchFiles();
});

// 날짜 포맷팅 함수
const formatDate = (datetime) => {
  if (!datetime) return ""; // 날짜 값이 없으면 빈 문자열 반환
  return new Date(datetime).toISOString().split("T")[0];
};
</script>

<template>
  <div class="announcement-detail-container">
    <!-- 공지사항 타이틀 -->
    <div class="title">
      <h1>공지사항</h1>
    </div>

    <!-- 목록/수정/삭제 버튼 -->
    <div class="header-actions">
      <button @click="goToList" class="list-btn">목록</button>
      <button v-if="isAuthor" @click="goToUpdatePage" class="edit-btn">수정</button>
      <button v-if="isAuthor" @click="deleteAnnouncement" class="delete-btn">삭제</button>
    </div>

    <!-- 공지사항 제목 및 작성자 정보 -->
    <div class="header">
      <div class="header-content">
        <h2>{{ announcement?.title }}</h2>
        <div class="meta">
          <span class="dept-name">{{ announcement?.deptName }}</span> |
          <span class="create-date">{{ formatDate(announcement?.createDatetime) }}</span>
        </div>
      </div>
    </div>

    <!-- 내용 -->
    <div class="content" v-html="announcement?.content"></div>

    <!-- 파일 목록 -->
    <div class="file-section" v-if="files.length > 0">
      <h3>첨부파일</h3>
      <ul>
        <li v-for="file in files" :key="file.id">
          📎
          <span
              @click="downloadFile(file.id, file.originName)"
              class="file-link"
          >
        {{ file.originName }}
      </span>
        </li>
      </ul>
    </div>

    <!-- 이전글/다음글 네비게이션 -->
    <div class="navigation">
      <table>
        <tbody>
        <tr>
          <td>
        <span
            v-if="prevAnnouncement"
            @click="router.push(`/announcements/${prevAnnouncement.annId}`)"
            class="nav-link"
        >
          이전글: {{ prevAnnouncement.title }}
        </span>
            <span v-else>이전글 없음</span>
          </td>
        </tr>
        <tr>
          <td>
        <span
            v-if="nextAnnouncement"
            @click="router.push(`/announcements/${nextAnnouncement.annId}`)"
            class="nav-link"
        >
          다음글: {{ nextAnnouncement.title }}
        </span>
            <span v-else>다음글 없음</span>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.announcement-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.title h1 {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 20px;
}

.list-btn,
.edit-btn,
.delete-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
}

/* 목록 버튼 스타일 */
.list-btn {
  background: linear-gradient(to right, #ff9900, #ffcc33);
  color: white;
}

.list-btn:hover {
  opacity: 0.9;
}

/* 수정 및 삭제 버튼 스타일 */
.edit-btn,
.delete-btn {
  background-color: #D9D9D9;
  color: #333;
}

.edit-btn:hover,
.delete-btn:hover {
  background-color: #bfbfbf;
}

.header {
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
  padding-bottom: 10px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  font-size: 24px;
  margin: 0;
  color: #333;
}

.meta {
  font-size: 14px;
  color: #555;
}

.content {
  margin-bottom: 20px;
  font-size: 16px;
  line-height: 1.5;
  min-height: 300px;
}

.file-section h3 {
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: bold;
}

.file-section ul {
  list-style: none;
  padding: 0;
}

.file-section li {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.file-section li a {
  color: #007bff;
  text-decoration: none;
  margin-left: 5px;
}

.file-link {
  color: #333; /* 일반 텍스트 색상 */
  cursor: pointer;
  text-decoration: none;
}

.navigation {
  margin-top: 20px;
}

.navigation table {
  width: 100%;
  border-collapse: collapse;
}

.navigation td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.navigation td a {
  text-decoration: none;
  color: #007bff;
}

.nav-link {
  color: #333; /* 일반 텍스트 색상 */
  cursor: pointer;
  text-decoration: none;
}
</style>
