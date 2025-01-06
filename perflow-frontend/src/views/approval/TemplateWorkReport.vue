<script setup>
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import InputField from "@/components/common/InputField.vue";
import ApprovalShareBox from "@/components/approval/ApprovalShareBox.vue";
import {ref, watch} from "vue";
import {createNewDocument} from "@/config/approval.js";
import router from "@/router/router.js";
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import DropdownBasic from "@/components/common/DropdownBasic.vue";
import ModalNoButton from "@/components/common/ModalNoButton.vue";
import OrgTree from "@/components/approval/OrgTree.vue";
import OrgTreeShare from "@/components/approval/OrgTreeShare.vue";
import Alert from "@/components/common/Alert.vue";

const approvalData = ref([]);
const shareData = ref([]);

// 서식 드롭다운
const dropdownOptions = [
  { label: "기본 서식", id: "newDoc" },
  { label: "지출결의서", id: "cashDisbursement" },
  { label: "업무보고서", id: "workReport" },
];

// 드롭다운 선택 시 호출
const handleDropdownSelect = (id) => {
  console.log(`선택된 드롭다운 옵션 id: ${id}`);
  router.push({ name: id }).catch((error) => {
    console.error("라우팅 에러: ", error);
  });
}

// 모달 상태
const isApprovalModalOpen = ref(false);
const isShareModalOpen = ref(false);
const openApprovalModal = () => (isApprovalModalOpen.value = true);
const closeApprovalModal = () => (isApprovalModalOpen.value = false);
const openShareModal = () => (isShareModalOpen.value = true);
const closeShareModal = () => (isShareModalOpen.value = false);

const title = ref('');  // 문서 제목
const fromDate = ref('');
const toDate = ref('');
const PROGRESSING = ref('');
const SPECIAL = ref('');
const PLANNED = ref('');

// 결재선 설정 업데이트
const updateApprovalList = (newList) => {

  const typeMapping = {
    동의: "SEQ",
    참조: "CC",
    합의: "AGR",
    병렬: "PLL",
    병렬합의: "PLLAGR"
  };

  let currentOrder = 1; // 현재 결재 순서
  let isPllGroup = false; // 병렬 그룹 여부

  approvalData.value = newList.map((item, index, array) => {

    console.log("현재 항목 타입: ", item.type);

    const isParallel = item.type === "병렬" || item.type === "병렬합의";

    if (isParallel) {
      // 병렬 그룹 시작
      isPllGroup = true;
    }

    // 병렬 그룹이 끝난 뒤 currentOrder 증가
    if (!isParallel && isPllGroup) {
      isPllGroup = false; // 병렬 그룹 종료
      currentOrder++; // 병렬 그룹 종료 후 증가
    }

    // 병렬 그룹이면 같은 currentOrder, 아니면 증가
    const lineOrder = isParallel ? currentOrder : currentOrder++;

    return {
      ...item,
      displayType: item.type, // 한글 값으로 표시
      approveType: typeMapping[item.type],
      approveLineOrder: lineOrder,
    };
  });

  // 병렬 그룹이 끝난 후 마지막 currentOrder 증가 처리
  if (isPllGroup) {
    currentOrder++;
  }

  console.log("updateApprovalList - 업데이트 된 approvalData: ", approvalData.value);
};

// 공유 설정 업데이트
const updateShareList = (newList) => {
  shareData.value = newList.map((item) => ({
    type: '공유',
    empId: item.empId,
    name: item.name,
    position: item.position,
  }));
  console.log("updateShareList - 업데이트 된 shareData: ", shareData.value);
};

// 결재 문서 데이터
const docData = () => {

  return {
    templateId: 6, // 업무보고서 서식 ID
    title: title.value, // 문서 제목
    fields: {
      fromDate: fromDate.value,
      toDate: toDate.value,
      PROGRESS: PROGRESSING.value,
      SPECIAL: SPECIAL.value,
      PLANNED: PLANNED.value,
    },
    approveLines: approvalData.value.map((line, index) => ({
      groupId: null,
      approveType: line.approveType,
      approveLineOrder: line.approveLineOrder,
      pllGroupId: null,
      approveTemplateTypes: 'MANUAL',
      approveSbjs: [
        {
          empDeptType: 'EMPLOYEE',
          empId: line.empId,
        },
      ],
    })),
    shares: shareData.value.map((share) => ({
      shareEmpDeptType: 'EMPLOYEE',
      employees: [share.empId],
    })),
  };
};

const createNewDoc = async () => {

  if (!title.value || !fromDate.value || !toDate.value) {
    showAlert('필수 항목을 모두 입력해주세요.');
    return;
  }

  try {
    const data = docData();
    const response = await createNewDocument(data);
    showAlert('문서를 상신했습니다.');
    goTo("/approval/outbox");
  } catch (error) {
    showAlert(`결재 문서 생성에 실패했습니다.`);
    console.error(error);
  }
};

const goTo = (url) => {
  router.push(url);
}

/* alert 창 */
const alertVisible = ref(false);
const alertMsg = ref('');
const showAlert = (msg) => {
  alertMsg.value = msg;
  alertVisible.value = true;
}

// 날짜 유효성 검사
watch([fromDate, toDate], ([newFromDate, newToDate]) => {
  if (newFromDate && newToDate && newFromDate > newToDate) {
    showAlert("입력한 끝 날짜가 시작 날짜보다 빠릅니다.");

    fromDate.value = '';
    toDate.value = '';
  }
});
</script>

<template>

  <Alert
      v-model="alertVisible"
      :message="alertMsg"
  />

  <div id="header-div">
    <div id="header-top" class="flex-between">
      <p id="title">결재 문서 생성</p>
    </div>
    <div id="header-bottom" class="flex-between">
      <div class="tabs">
        <span class="tab active">업무 보고서</span>
      </div>
    </div>
  </div>

  <div class="main-container">
    <!-- 빈 컨테이너 -->
    <div class="empty-container"></div>

    <div class="form-container">

      <div class="field-container">

        <div class="date-selection-container">
          <!-- 진행 기간 -->
          <label class="label">
            <span class="label-name">진행일시</span>
            <span class="asterisk">*</span>
          </label>
          <SearchGroupBar
              v-model="fromDate"
              placeholder="시작일"
              type="date"
          />
          <span class="tilde"> ~ </span>
          <SearchGroupBar
              v-model="toDate"
              placeholder="완료일"
              type="date"
          />
        </div>

        <!-- 제목 -->
        <InputField
            v-model="title"
            label="제목"
            placeholder="제목을 입력해 주세요."
            :isRequired="true"
            width="600px"
        />

        <div class="content-field">
          <!-- 진행사항 -->
          <InputField
              v-model="PROGRESSING"
              label="진행사항"
              placeholder="내용을 입력해 주세요."
              type="textarea"
              height="180px"
              width="600px"
          />
          <!-- 특이사항 -->
          <InputField
              v-model="SPECIAL"
              label="특이사항"
              placeholder="내용을 입력해 주세요."
              type="textarea"
              height="180px"
              width="600px"
          />
          <!-- 예정사항 -->
          <InputField
              v-model="PLANNED"
              label="예정사항"
              placeholder="내용을 입력해 주세요."
              type="textarea"
              height="180px"
              width="600px"
          />
        </div>
      </div>

      <div class="button-group">
        <ButtonBasic
            color="gray"
            size="medium"
            label="취소하기"
            @click=""
        />
        <ButtonBasic
            color="orange"
            size="medium"
            label="상신하기"
            @click="createNewDoc"
        />
      </div>
    </div>

    <!-- 결재선 -->
    <div class="box-container">

      <!-- 드롭 다운 -->
      <div class="dropdown-container">
        <span class="dropdown-title">서식 선택</span>
        <DropdownBasic
            defaultOption="업무보고서"
            :options="dropdownOptions"
            @selectOption="handleDropdownSelect"
        />
      </div>

      <ApprovalShareBox
          title="결재선"
          :placeholder="approvalData.length ? '' : '결재선이 없습니다.'"
          :data="approvalData.map((item) => ({
          ...item,
          type: item.displayType  // 한글 값만 표시
          }))"
          @onSettingsClick="openApprovalModal"
      />

      <ModalNoButton
          :isOpen="isApprovalModalOpen"
          title="결재선 설정"
          width="900px"
          height="420px"
          @close="closeApprovalModal"
      >
        <template #default>
          <div class="modal-layout">
            <OrgTree
                @updateApprovalList="updateApprovalList"
                @closeModal="closeApprovalModal"
            />
          </div>
        </template>
      </ModalNoButton>

      <ApprovalShareBox
          title="공유"
          :placeholder="shareData.length ? '' : '공유처가 없습니다.'"
          :data="shareData.map((item) => ({
          type: '공유',
          name: item.name,
          position: item.position,
          }))"
          @onSettingsClick="openShareModal"
      />

      <ModalNoButton
          :isOpen="isShareModalOpen"
          title="공유 설정"
          width="650px"
          height="450px"
          @close="closeShareModal"
      >
        <template #default>
          <div class="modal-layout">
            <OrgTreeShare
                @updateShareList="updateShareList"
                @closeModal="closeShareModal"
            />
          </div>
        </template>
      </ModalNoButton>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  display: flex;
  justify-content: center; /* 중앙 정렬 */
  /* align-items: center; /* 세로 정렬 */
  gap: 0px;
  min-width: 1200px;  /* 최소 너비 설정 */
  padding: 0 50px;  /* 좌우 여백 */
}

.empty-container {
  flex: 0.3;
  min-width: 200px;
  max-width: 300px;
}

.form-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  min-width: 600px;
  margin-top: 50px;
  margin-right: 30px;
}

.field-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 700px;
}

.box-container {
  flex: 0.3;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 50px;
}

.button-group {
  display: flex;
  flex-direction: row; /* 버튼 가로 정렬 */
  gap: 40px; /* 버튼 간 간격 */
  align-items: center; /* 중앙 정렬 */
  margin-top: auto; /* 버튼을 항상 아래쪽으로 */
  padding-top: 20px;  /* 버튼 위에 여유 공간 */
}

/* 모달 내부 레이아웃 */
.modal-layout {
  display: flex;
  gap: 10px;
  height: 300px;
}

.date-selection-container {
  display: flex;
  align-items: center;
  height: 40px; /* 고정 높이 설정 */
  margin-bottom: 20px;
}

.label {
  display: inline-flex;
  align-items: center;
  width: 80px;
}

.tilde {
  margin: 0 5px;
  line-height: 40px;
}


.approval-table th,
.approval-table td {
  border: none; /* 내부 셀의 모든 테두리 제거 */
  border-bottom: 1px solid #D9D9D9; /* 셀 아래 가로선만 표시 */
  padding: 8px;
  text-align: center;
}

.approval-table tr:last-child td {
  border-bottom: none; /* 마지막 행의 아래쪽 가로선 제거 */
}

.approval-table th {
  background-color: #f4f4f4;
  font-weight: bold;
}

.share-table th,
.share-table td {
  border: none; /* 내부 셀의 모든 테두리 제거 */
  border-bottom: 1px solid #D9D9D9; /* 셀 아래 가로선만 표시 */
  padding: 8px;
  text-align: center;
}

.share-table tr:last-child td {
  border-bottom: none; /* 마지막 행의 아래쪽 가로선 제거 */
}

.share-table th {
  background-color: #f4f4f4;
  font-weight: bold;
}

#title {
  font-size: 35px;
  font-weight: bold;
  color: #3C4651;
}

#header-div {
  display: flex;
  flex-direction: column; /* 세로 방향으로 정렬 */
  justify-content: center; /* 세로 중앙 정렬 */
  align-items: center; /* 가로 중앙 정렬 */
  margin-top: 50px;
}

#header-top, #header-bottom {
  margin-bottom: 10px;
  width: 900px;
}

.tabs {
  display: flex;
  gap: 20px;
  font-size: 20px;
}

.tab {
  cursor: pointer;
  padding: 5px 10px;
}

.tab.active {
  font-weight: bold;
  border-bottom: 2px solid #ff6600;
}

.dropdown-title {
  font-size: 14px;
  font-weight: bold;
  color: #3C4651;
}

.label-name {
  font-size: 14px;
  font-weight: bold;
  margin-right: 5px;
}

.asterisk {
  color: red;
  margin-right: 15px;
}

.dropdown-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dropdown-title {
  font-size: 14px;
  font-weight: bold;
  color: #3C4651;
}

/* input field 스크롤 설정 */
/* input field 의 textarea 까지 전달 */
.content-field::v-deep(textarea)::-webkit-scrollbar {
  width: 5px;
}
.content-field::v-deep(textarea)::-webkit-scrollbar-track {
  border-radius: 10px;
}

.content-field::v-deep(textarea)::-webkit-scrollbar-thumb {
  background: #D9D9D9;
  border-radius: 10px;
}
</style>