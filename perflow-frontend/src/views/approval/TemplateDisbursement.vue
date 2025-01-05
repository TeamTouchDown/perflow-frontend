<script setup>
import ButtonBasic from "@/components/common/ButtonBasic.vue";
import InputField from "@/components/common/InputField.vue";
import ApprovalShareBox from "@/components/approval/ApprovalShareBox.vue";
import {computed, ref} from "vue";
import {createNewDocument} from "@/config/approval.js";
import router from "@/router/router.js";
import SearchGroupBar from "@/components/common/SearchGroupBar.vue";
import DropdownBasic from "@/components/common/DropdownBasic.vue";
import ModalNoButton from "@/components/common/ModalNoButton.vue";
import OrgTree from "@/components/approval/OrgTree.vue";
import OrgTreeShare from "@/components/approval/OrgTreeShare.vue";
import Alert from "@/components/common/Alert.vue";

const approvalData = ref([]);  // approvalShareBox 에 전달할 데이터
const shareData = ref([]);  // 모달에서 선택한, approvalShareBox 에 전달할 데이터

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


const title = ref('');  // 문서 제목
const expendDate = ref(""); // 지출일
const rows = ref([
  { vendor: "", usage: "", amount: 0 }, // 초기 한 행
]);

// 합계 계산
const totalAmount = computed(() => {
  return rows.value.reduce((sum, row) => sum + Number(row.amount || 0), 0);
});

// 합계에 , 추가
const formatTotalAmount = computed(() => {

  return totalAmount.value.toLocaleString();
});

// 행 추가
const addRow = () => {
  rows.value.push({ vendor: "", uasge: "", amount: 0 })
}

// 행 삭제
const deleteRow = (index) => {
  rows.value.splice(index, 1);
}

// 결재 문서 데이터
const docData = () => {

  const fields = {
    expendDate: expendDate.value || ""  // 지출일
  }
  // 거래서, 사용 내역, 금액
  rows.value.forEach((row, index) => {
    const number = index + 1; // 1부터 시작
    fields[`VENDOR${number}`] = row.vendor || "";
    fields[`USAGE${number}`] = row.usage || "";
    fields[`AMOUNT${number}`] = row.amount || "";
  });

  return {
    templateId: 5, // 지출 결의서 서식 id
    title: title.value, // 문서 제목
    fields: fields,
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

  if (!title.value) {
    showAlert('제목을 입력해주세요.');
    return;
  }

  if (!expendDate.value) {
    showAlert('지출일을 선택해주세요.')
    return;
  }

  const hasEmptyAmount = rows.value.some((row) => !row.amount || row.amount <= 0);
  if (hasEmptyAmount) {
    showAlert('금액을 입력해주세요. 0보다 큰 값을 입력해야 합니다.')
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
        <span class="tab active">지출 결의서</span>
      </div>
    </div>
  </div>

  <div class="main-container">
    <!-- 빈 컨테이너 -->
    <div class="empty-container"></div>
    <div class="form-container">
      <div class="field-container">
        <!-- 제목 -->
        <InputField
            v-model="title"
            label="제목"
            placeholder="제목을 입력해 주세요."
            :isRequired="true"
            width="600px"
        />

        <div class="date-container">
          <!-- 지출일 -->
          <label class="label">
            <span class="label-name">지출일</span>
            <span class="asterisk">*</span>
          </label>
          <SearchGroupBar
              v-model="expendDate"
              placeholder="지출일 선택"
              type="date"
          />
        </div>
      </div>

      <!-- 지출 내역 테이블 -->
      <div class="table-container">
        <table class="expense-table">
          <thead>
          <tr>
            <th>거래처</th>
            <th>사용내역</th>
            <th>금액</th>
            <th></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(row, index) in rows" :key="index">
            <td>
              <input v-model="row.vendor" type="text" placeholder="거래처" />
            </td>
            <td>
              <input v-model="row.usage" type="text" placeholder="사용내역 및 용도" />
            </td>
            <td>
              <input v-model="row.amount" type="number" placeholder="금액" />
            </td>
            <td>
              <button
                  v-if="rows.length > 1"
                  class="action-button delete"
                  @click="deleteRow(index)"
              >x</button>
            </td>
          </tr>
          </tbody>
        </table>
        <button class="action-button add" @click="addRow">+</button>

        <!-- 합계 -->
        <div class="total">
          <span>합계 {{ formatTotalAmount }} 원 </span>
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

      <div class="dropdown-container">
        <span class="dropdown-title">서식 선택</span>
        <DropdownBasic
            defaultOption="지출결의서"
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
  min-width: 600px; /* InputField 너비와 일치시킴*/
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
  margin-top: auto; /* 버튼을 항상 아래쪽으로 */
  padding-top: 20px;  /* 버튼 위에 여유 공간 */
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
  margin-top: 30px;
  margin-bottom: 20px; /* 버튼과 테이블 간의 간격 */
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

/* 지출일 */
.label-name {
  font-size: 14px;
  font-weight: bold;
  margin-right: 5px;
}

.asterisk {
  color: red;
  margin-right: 15px;
}

/* 지출 내역 테이블 */
.expense-table {
  width: 100%;
  border-collapse: separate; /* 셀 경계와 테두리 중첩 방지 */
  border-spacing: 0; /* 셀 간 간격 제거 */
  border: 1px solid #AFA9A9; /* 테이블 전체 테두리 */
  border-radius: 10px; /* 테이블 모서리 둥글게 */
  overflow: hidden; /* 둥근 모서리 유지 */
}

.expense-table th,
.expense-table td {
  border-bottom: 1px solid #AFA9A9; /* 셀 내부에만 경계선 추가 */
  border-right: 1px solid #AFA9A9; /* 셀 오른쪽 경계선 추가 */
  text-align: center;
}

.expense-table th {
  background-color: #f4f4f4;
  font-weight: bold;
  font-size: 14px;
}

.expense-table input {
  border: none; /* 입력 필드 테두리 제거 */
  outline: none;  /* 포커스 하면 나오는 테두리 제거 */
  text-align: left;
  padding: 4px;
}

/* 금액 칸 화살표 제거 */
.expense-table input[type="number"]::-webkit-inner-spin-button,
.expense-table input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 테이블 버튼 */
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #AFA9A9;
  border-radius: 5px;
  font-size: 14px;
  width: 25px;
  height: 25px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

/* + 버튼 */
.action-button.add {
  color: #3C4651;
}

/* x 버튼 */
.action-button.delete {
  color: #3C4651;
}

/* 호버 효과 */
.action-button:hover {
  background-color: #F4F4F4;
  color: #3C4651;
}

.total {
  margin-top: 50px;
  margin-bottom: 50px;
  font-size: 20px;
  font-weight: bold;
  padding: 10px;
  border-bottom: 2px solid #ff6600;
  border-top: 2px solid #ff6600;
  text-align: right;
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

.date-container {
  height: 100px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.date-container .label {
  margin-right: 10px;
}

</style>