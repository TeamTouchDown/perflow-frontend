<script setup>
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import InputField from "@/components/common/InputField.vue";
import ApprovalShareBox from "@/components/approval/ApprovalShareBox.vue";
import {ref} from "vue";
import {createNewDocument} from "@/config/approval.js";
import router from "@/router/router.js";
import OrgTree from "@/components/approval/OrgTree.vue";
import OrgTreeShare from "@/components/approval/OrgTreeShare.vue";
import ModalNoButton from "@/components/common/ModalNoButton.vue";
import DropdownBasic from "@/components/common/DropdownBasic.vue";
import Alert from "@/components/common/Alert.vue";

const approvalData = ref([]);
const shareData = ref([]);

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

// 모달 상태
const isApprovalModalOpen = ref(false);
const isShareModalOpen = ref(false);
const openApprovalModal = () => (isApprovalModalOpen.value = true);
const closeApprovalModal = () => (isApprovalModalOpen.value = false);
const openShareModal = () => (isShareModalOpen.value = true);
const closeShareModal = () => (isShareModalOpen.value = false);


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

const title = ref('');  // 문서 제목
const content = ref('');  // 문서 내용

// 결재 문서 데이터
const docData = () => {
  return {
    templateId: 4, // 기본 서식 id
    title: title.value, // 문서 제목
    fields: {
      CONTENT: content.value, // 기본 서식의 필드 데이터
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

// 새 문서 생성
const createNewDoc = async () => {

  if (!title.value || !content.value) {
    showAlert('빈 칸을 모두 채워주세요.');
    return;
  }

  try {
    const data = docData();
    const response = await createNewDocument(data);
    showAlert('문서를 상신했습니다.');
    goTo("/approval/outbox");
  } catch (error) {
    showAlert('결재 문서 생성에 실패했습니다.');
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

// 툴팁
const tooltipText1 = "동의:  순서대로 결재를 진행합니다. \n " +
    "합의:  순서대로 결재를 진행합니다. '동의'와 동일하나, 다른 부서의 사원의 결재가 필요할 때 '합의'로 지정합니다. \n " +
    "참조:  해당 문서를 참조할 수 있는 사람을 지정합니다. 참조자는 해당 문서를 결재할 수 없습니다. \n" +
    "병렬:  여러 명의 병렬 결재가 필요할 때 진행합니다. 한 명이라도 결재를 반려하면, 문서가 반려됩니다. \n" +
    "병렬합의:  '병렬'과 동일하나, 다른 부서 사원의 결재가 필요할 때 '병렬합의'로 지정합니다. \n";
const tooltipText2 = "공유자로 설정된 사원은 '수신함'에서 해당 문서를 볼 수 있습니다. \n" +
    "하지만 해당 문서를 결재할 수는 없습니다.";
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
        <span class="tab active">기본 서식</span>
      </div>
    </div>
  </div>

  <div class="main-container">
    <!-- 빈 컨테이너 -->
    <div class="empty-container"></div>

    <div class="form-container">
      <!-- 제목 -->
      <InputField
          v-model="title"
          label="제목"
          placeholder="제목을 입력해 주세요."
          :isRequired="true"
          width="500px"
      />

      <!-- 내용 -->
      <InputField
          class="input-field-content"
          v-model="content"
          label="내용"
          placeholder="내용을 입력해 주세요."
          type="textarea"
          :isRequired="true"
          height="400px"
          width="500px"
      />

      <div class="button-group">
        <ButtonBasic
            color="gray"
            size="medium"
            label="취소하기"
            @click="router.go(-1)"
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

      <div class="dropdown-container">
        <span class="dropdown-title">서식 선택</span>
        <DropdownBasic
            defaultOption="기본 서식"
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
          :tooltipText=tooltipText1
          :tooltipPosition="{ bottom: '450px', left: '52%' }"
          :tooptipWidth="'700px'"
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
          :tooltipText=tooltipText2
          :tooltipPosition="{ bottom: '550px', left: '50%' }"
          :tooltipWidth="'400px'"
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
  justify-content: center;  /* 중앙 정렬 */
  align-items: center;  /* 세로 정렬 */
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
  gap: 0px;
  min-width: 500px; /* InputField 너비와 일치시킴 */
  margin-top: 50px;
  margin-right: 30px;
}

.box-container {
  flex: 0.3;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.button-group {
  display: flex;
  flex-direction: row; /* 버튼 가로 정렬 */
  gap: 40px; /* 버튼 간 간격 */
  align-items: center; /* 중앙 정렬 */
}

/* 모달 내부 레이아웃 */
.modal-layout {
  display: flex;
  gap: 10px;
  height: 300px;
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
.input-field-content::v-deep(textarea)::-webkit-scrollbar {
  width: 5px;
}
.input-field-content::v-deep(textarea)::-webkit-scrollbar-track {
  border-radius: 10px;
}

.input-field-content::v-deep(textarea)::-webkit-scrollbar-thumb {
  background: #D9D9D9;
  border-radius: 10px;
}
</style>