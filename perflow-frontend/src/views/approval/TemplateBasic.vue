<script setup>
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import InputField from "@/components/common/InputField.vue";
import ApprovalShareBox from "@/components/approval/ApprovalShareBox.vue";
import {ref} from "vue";
import {createNewDocument} from "@/config/approval.js";
import router from "@/router/router.js";
import ButtonDropDown2 from "@/components/common/ButtonDropDown2.vue";
import OrgTree from "@/components/approval/OrgTree.vue";
import OrgTreeShare from "@/components/approval/OrgTreeShare.vue";
import ModalNoButton from "@/components/common/ModalNoButton.vue";

const selectedApprovalEmployees = ref([]); // 체크된 사원 목록
const selectedShareEmployees = ref([]); // 체크된 사원 목록

const approvalList = ref([]); // 결재 목록
const approvalData = ref([]);  // approvalShareBox 에 전달할 데이터

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

const updateShareList = (newList) => {
  shareData.value = newList.map((item) => ({
    type: '공유',
    empId: item.empId,
    name: item.name,
    position: item.position,
  }));
  console.log("updateShareList - 업데이트 된 shareData: ", shareData.value);
};

const shareList = ref([]);  // 공유 목록
const shareData = ref([]);  // 모달에서 선택한, approvalShareBox 에 전달할 데이터

// 테스트용
const isTestApprovalModalOpen = ref(false);
const isTestShareModalOpen = ref(false);
const openTestApprovalModal = () => (isTestApprovalModalOpen.value = true);
const closeTestApprovalModal = () => (isTestApprovalModalOpen.value = false);
const openTestShareModal = () => (isTestShareModalOpen.value = true);
const closeTestShareModal = () => (isTestShareModalOpen.value = false);


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
const isShareModalOpen = ref(false);  // 공유 모달 상태

// 모달 열기/닫기
const openApprovalModal = () => (isApprovalModalOpen.value = true);
const closeApprovalModal = () => (isApprovalModalOpen.value = false);

const openShareModal = () => (isShareModalOpen.value = true);
const closeShareModal = () => (isShareModalOpen.value = false);

// 설정 저장
const saveApprovalSettings = () => {
  approvalData.value = [...approvalList.value];
  console.log("결재선 설정 저장: approvalData: ", approvalData.value);
  closeApprovalModal();
};

const saveTestApprovalSettings = () => {
  approvalData.value = [...approvalList.value];
  console.log("결재선 설정 저장: approvalData: ", approvalData.value);
  closeTestApprovalModal();
}

const saveTestShareSettings = () => {
  shareData.value = [...shareList.value]; // 선택된 공유 데이터
  console.log("공유 설정 저장 - shareData: ", shareData.value);
  closeShareModal();
}

const saveShareSettings = () => {
  shareData.value = [...shareList.value]; // 선택된 공유 데이터
  console.log("공유 설정 저장 - shareData: ", shareData.value);
  closeShareModal();
}

// 조직도에서 선택된 사원 업데이트
const updateApprovalSelectedEmployees = (employees) => {
  console.log("updateApprovalSelectedEmployees 호출");
  console.log("조직도에서 선택된 결재선 사원 목록: ", employees);
  selectedApprovalEmployees.value = employees;
  console.log("업데이트 된 selectedApprovalEmployees: ", selectedApprovalEmployees.value);
};

const updateShareSelectedEmployees = (employees) => {
  console.log("updateShareSelectedEmployees 호출");
  console.log("선택된 공유 사원 목록: ", employees);
  selectedShareEmployees.value = employees;
  // shareData.value = employees;  // 공유 리스트 업데이트
  console.log("업데이트 된 shareData: ", shareData.value);
}

const selectedApproveRows = ref(new Set());
const selectedShareRows = ref(new Set());

// 체크박스 선택/해제 핸들러
const toggleApproveRowSelection = (index) => {
  if (selectedApproveRows.value.has(index)) {
    selectedApproveRows.value.delete(index); // 이미 선택된 경우 해제
  } else {
    selectedApproveRows.value.add(index); // 선택 안 된 경우 추가
  }
};

const toggleShareRowSelection = (index) => {
  if (selectedShareRows.value.has(index)) {
    selectedShareRows.value.delete(index); // 이미 선택된 경우 해제
  } else {
    selectedShareRows.value.add(index); // 선택 안 된 경우 추가
  }
};

// 선택된 행 삭제
const deleteApproveSelectedRows = () => {
  approvalList.value = approvalList.value.filter(
      (_, index) => !selectedApproveRows.value.has(index)
  );
  selectedApproveRows.value.clear(); // 선택 목록 초기화
};

const deleteShareSelectedRows = () => {
  shareList.value = shareList.value.filter(
      (_, index) => !selectedShareRows.value.has(index)
  );
  selectedShareRows.value.clear(); // 선택 목록 초기화
};


// 버튼 클릭 시 결재 순서에 추가
const addToApprovalList = (type) => {
  console.log("addToApprovalList 메소드 호출");

  const typeMapping = {
    동의: "SEQ",
    참조: "CC",
    합의: "AGR",
    병렬: "PLL",
    병렬합의: "PLLAGR"
  };

  const newApprovals = selectedApprovalEmployees.value.map((emp) => ({
    type,
    displayType: type,  // 결재방식 - 한글 값
    approveType: typeMapping[type], // 결재방식 - enum 값
    name: emp.name, // 사원 이름
    position: emp.position, // 직위
    empId: emp.empId,
  }));
  approvalList.value.push(...newApprovals);
  console.log("결재선 추가 - 업데이트 된 approvalList: ", approvalList.value);
  selectedApprovalEmployees.value = []; // 선택 목록 초기화
};

const addToShareList = () => {
  // 추가 한 사람 다시 추가 못하도록
  const newShares = selectedShareEmployees.value.filter(
      (emp) => !shareList.value.some((share) => share.empId === emp.empId)
  ).map((emp) => ({
    empId: emp.empId,
    name: emp.name,
    position: emp.position,
  }));
  shareList.value.push(...newShares);
  selectedShareEmployees.value = [];  // 선택 목록 초기화
};

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

const createNewDoc = async () => {

  if (!title.value || !content.value) {
    alert('빈 칸을 모두 채워주세요.');
    return;
  }

  try {
    const data = docData();
    const response = await createNewDocument(data);
    alert('결재 문서 생성 완료');
    goTo("/approval/home");
  } catch (error) {
    alert(`결재 문서 생성에 실패했습니다. 오류: ${error.message}`);
    console.error(error);
  }
};

const goTo = (url) => {
  router.push(url);
}

</script>

<template>

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

      <!-- 드롭 다운 -->
      <span class="dropdown-title">서식 선택</span>
      <ButtonDropDown2
        :options="dropdownOptions"
        defaultOption="기본 서식"
        width="155px"
        height="35px"
        fontSize="15px"
        @selectId="handleDropdownSelect"
      />

      <!-- 테스트 -->
      <ApprovalShareBox
          title="테스트"
          :placeholder="approvalData.length ? '' : '결재선이 없습니다.'"
          :data="approvalData.map((item) => ({
          ...item,
          type: item.displayType  // 한글 값만 표시
          }))"
          @onSettingsClick="openTestApprovalModal"
      />

      <ModalNoButton
          :isOpen="isTestApprovalModalOpen"
          title="결재선 설정 테스트"
          width="900px"
          height="420px"
          @close="closeTestApprovalModal"
      >
        <template #default>
          <div class="modal-layout">
            <OrgTree
                @updateApprovalList="updateApprovalList"
                @closeModal="closeTestApprovalModal"
            />
          </div>
        </template>
      </ModalNoButton>
        <!---->

      <!-- 테스트 -->
      <!-- 테스트 -->
      <ApprovalShareBox
          title="테스트"
          :placeholder="shareData.length ? '' : '공유처가 없습니다.'"
          :data="shareData.map((item) => ({
          type: '공유',
          name: item.name,
          position: item.position,
          }))"
          @onSettingsClick="openTestShareModal"
      />

      <ModalNoButton
          :isOpen="isTestShareModalOpen"
          title="공유 설정 테스트"
          width="800px"
          height="500px"
          @close="closeTestShareModal"
      >
        <template #default>
          <div class="modal-layout">
            <OrgTreeShare
                @updateShareList="updateShareList"
                @closeModal="closeTestShareModal"
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

.approval-button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  margin: 20px;
  width: fit-content; /* 자식인 buttonbasic 의 폭에 맞춤 */
}

/* 모달 내부 레이아웃 */
.modal-layout {
  display: flex;
  gap: 10px;
  height: 300px;
}

/* 모달 내부 박스 공통 스타일 */
.modal-box {
  flex: 1;
  border: none;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
}

.modal-box.center {
  max-width: fit-content;
  padding: 0;
  margin: auto;
}

.modal-box.left {
  height: fit-content; /* 자식 컴포넌트 크기에 맞춤*/
  padding-right: 0;
}

.modal-box.right {
  display: flex;
  flex-direction: column;
  height: 300px; /* 전체 높이를 고정 */
}

.share-table,
.approval-table {
  flex: 1; /* 테이블이 가능한 최대 공간을 차지 */
  overflow-y: auto; /* 내용이 많아지면 스크롤 */
  margin: 0;
  border-spacing: 0; /* 셀 간의 간격 제거 */
  border-collapse: separate; /* 둥근 테두리 유지 */
}

.table-container {
  flex: 1;
  overflow-y: auto; /* 테이블에 스크롤 추가 */
  margin-bottom: 10px; /* 버튼과 테이블 간의 간격 */
}

.button-container {
  display: flex;
  justify-content: flex-end; /* 버튼을 오른쪽 정렬 */
  margin-top: 10px; /* 테이블과 버튼 사이의 간격 */
}

.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.approval-table {
  width: 100%;
  border: 1px solid #D9D9D9; /* 테이블 바깥 테두리 */
  border-radius: 10px; /* 둥근 테두리 */
  border-spacing: 0; /* 셀 간의 간격 제거 */
  border-collapse: separate; /* border-spacing 적용을 위해 separate 설정 */
  overflow: hidden; /* 둥근 테두리를 유지 */
  margin-top: 10px;
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


/* 선택된 행 */
.selected-row {
  background-color: #f0f0f0; /* 클릭 시 회색 배경 적용 */
  cursor: pointer;
}

.share-table {
  width: 100%;
  border: 1px solid #D9D9D9; /* 테이블 바깥 테두리 */
  border-radius: 10px; /* 둥근 테두리 */
  border-spacing: 0; /* 셀 간의 간격 제거 */
  border-collapse: separate; /* border-spacing 적용을 위해 separate 설정 */
  overflow: hidden; /* 둥근 테두리를 유지 */
  margin-top: 10px;
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