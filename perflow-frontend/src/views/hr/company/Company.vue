<script setup>
import ButtonBack from "@/components/common/ButtonBack.vue";
import api from "@/config/axios.js";
import {computed, onMounted, ref} from "vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue"
import CompanyModifySideBar from "@/components/hr/sideBar/CompanyInfoModifySideBar.vue";
import CompanyInfo from "@/views/hr/company/CompanyInfo.vue";
import CompanyPolicy from "@/views/hr/company/CompanyPolicy.vue";
import CompanyPolicyModifySideBar from "@/components/hr/sideBar/CompanyPolicyModifySideBar.vue";

const company = ref({});

const formattedDate = computed(() => {
  const date = new Date(company.value.establish);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}년 ${month}월 ${day}일`;
});
// 초기 선택 상태 설정 (예: '상세'가 기본 선택)
const selectedTitle = ref('detail');

// 제목 선택 함수
const selectTitle = (title) => {
  selectedTitle.value = title;
  hideSidebar();
};
const isInfoSidebarOpen = ref(false);
const isPolicySidebarOpen = ref(false);

function showSidebar() {
  if(selectedTitle.value === 'detail') {
    isInfoSidebarOpen.value = true;
  } else {
    isPolicySidebarOpen.value = true;
  }
}
function hideSidebar() {
  isInfoSidebarOpen.value = false;
  isPolicySidebarOpen.value = false;
}

const fetchCompany = async () => {
  const response = await api.get("/company");
  company.value = response.data;
};

onMounted(async ()=>{
  await fetchCompany();
});
</script>

<template>
  <CompanyModifySideBar :isSidebarOpen="isInfoSidebarOpen" @close-sidebar="hideSidebar" title="회사 정보 수정"/>
  <CompanyPolicyModifySideBar :is-sidebar-open="isPolicySidebarOpen" @close-sidebar="hideSidebar" title="회사 정책 수정"/>
  <div id="my-page-container">
    <div id="title-container">
      <p>회사 정보</p>
      <ButtonBack/>
    </div>
    <div id="info-header-container">
      <div class="info-header-item"><span class="item-title">회사명</span><p id="name">{{company.name}}</p></div>
      <div class="info-header-item"><span class="item-title">대표자</span><p>{{company.chairman}}</p></div>
      </div>
    <div id="middle-line">
      <div class="title-list">
        <p
            class="middle-title"
            :class="{ 'selected-title': selectedTitle === 'detail' }"
            @click="selectTitle('detail')"
        >
          상세
        </p>
        <p
            class="middle-title"
            :class="{ 'selected-title': selectedTitle === 'policy' }"
            @click="selectTitle('policy')"
        >
          정책
        </p>
      </div>
      <ButtonBasic
        color="orange"
        size="medium"
        label="수정하기"
        @click="showSidebar"
        id="modify-button"
      />
    </div>
    <hr>
    <CompanyInfo
        v-if="selectedTitle === 'detail'"
        :address="company.address" :contact="company.contact" :establish="formattedDate" :email="company.email"/>
    <CompanyPolicy
        v-if="selectedTitle === 'policy'"
        :annual-count="company.annualCount"
        :payment-datetime="company.paymentDatetime"
    />
  </div>
</template>

<style scoped>
p {
  margin: 0;
  padding: 0;
}
hr {
  margin: 0 0 40px 0;
  width: 900px;
}
#my-page-container{
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #3c4651 ;
}
#title-container, #info-header-container{
  width: 900px;
  margin-bottom: 50px;
}
#title-container {
  height: 150px;
  display: flex;
  justify-content: space-between;
  padding-top: 50px;
}
#title-container > p {
  font-weight: bold;
  font-size: 35px;
}
#info-header-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}
#middle-line{
  display: flex;
  justify-content: space-between;
  width: 900px;
  margin-bottom: 0;
}
#name {
  font-size: 30px;
  font-weight: bold;
  color: #F37321;
  margin: 0;
  padding: 0;
}
#modify-button{
  height: 45px;
}
.info-header-item {
  display: flex;
  gap: 20px;
  align-items: center;
}
.item-title {
  font-weight: bold;
  color: black;
}
.middle-title {
  padding-bottom: 20px;
  width: 80px;
  font-weight: bold;
  font-size: 20px;
  text-align: center;
  cursor: pointer;
}
.selected-title {
  border-bottom: 2px solid #F37321;
}
.title-list {
  display: flex;
  gap: 10px;
}

</style>