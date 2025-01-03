<script setup>
import ButtonLong from "@/components/common/ButtonLong.vue";
import ButtonBasic from "@/components/common/ButtonBasic.vue"
import api from "@/config/axios.js";
import FileUpload from "@/components/common/FileUpload.vue";
import {ref} from "vue";
import {useStore} from "@/store/store.js";
import HeaderContainer from "@/components/hr/HeaderContainer.vue";
import router from "@/router/router.js";
import Alert from "@/components/common/Alert.vue";

const selectedFile = ref([]);
const store = useStore();

const successModalVisible = ref(false);
const failModalVisible = ref(false);

const updateSuccessModalVisible = (value) => {

  successModalVisible.value = value;
  if( value === false ) {
    router.push("/hr/employees");
  }
}
const updateFailModalVisible = (value) => {

  failModalVisible.value = value;
  if(value === false ){
    location.reload();
  }
}

const fetchSelectedFile = (files) => {
  selectedFile.value = files
}

const downloadCSV = async () => {
  try {
    const response = await api.get('/csv/download', {
      responseType: 'blob', // 바이너리 데이터를 받기 위해 blob으로 설정
    });

    // 응답 헤더에서 파일명 추출
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'employee.csv'; // 기본 파일명
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*?=['"]?([^;\r\n"]+)/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].replace(/UTF-8''/, ''));
      }
    }

    // Blob 생성
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });

    // 브라우저에서 파일 다운로드 처리
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // 링크 제거

  } catch (error) {
    console.error('CSV 다운로드 실패:', error);
  }
};


const triggerFileInput = () => {
  if(selectedFile.value.length === 0) {
    updateFailModalVisible(true);
  }
  const confirmed = window.confirm('CSV 파일을 업로드 하시겠습니까?');
  if (confirmed) {
    uploadCSV(selectedFile.value.pop(0));
  }
};

const uploadCSV = async (file) => {
  try {

    store.showLoading();

    // FormData 생성 및 데이터 추가
    const formData = new FormData();
    formData.append("empCSV", file); // 이미지 파일 추가

    await api.post("/hr/employees/list", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    updateSuccessModalVisible(true)
  }catch (error){
    if(error instanceof TypeError){
      alert("오류가 발생했습니다. 등록하신 파일을 확인해주세요.");
      location.reload();
    } if (error.response.data.message){
      updateFailModalVisible(true);
    } else {
      updateFailModalVisible(true);
    }
  }finally {
    store.hideLoading();
  }
};
</script>

<template>
  <Alert :model-value=successModalVisible message="등록에 성공했습니다." @update:model-value="updateSuccessModalVisible"/>
  <Alert :model-value=failModalVisible message="사원 일괄 등록 중 오류가 발생했습니다." @update:model-value="updateFailModalVisible"/>
  <div id="emp-list-register-container">
    <HeaderContainer
      title="구성원"
      flow="구성원/구성원등록"
    />
    <div class="container-item" id="notice-container">
      <div id="notice"><img src="@/assets/image/check.png" alt="체크"><p>주의 사항</p></div>
      <div id="notice-item">
        <p>1. perflow 제공 양식이 아닐 경우 업로드에 실패할 수 있습니다.</p>
        <p>2. 양식을 임의로 수정할 경우 업로드에 실패할 수 있습니다.</p>
        <p>3. 필수 입력 사항이 비어있을 경우 업로드에 실패할 수 있습니다.</p>
      </div>
    </div>
    <div class="item-title">
      <p class="number">01</p><p class="title">CSV 템플릿 다운로드</p>
    </div>
    <div class="container-item">
      <div class="item-list">
        <ButtonBasic
            color="orange"
            size="small"
            label="필수입력"
        />
        <p>사번, 이름, 주민등록번호,  이메일, 연락처</p>
      </div>
      <hr>
      <div class="item-list">
        <ButtonBasic
            color="gray"
            size="small"
            label="선택입력"
        />
        <p>직급, 직책, 부서, 월급, 주소, 성별</p>
      </div>
    </div>
    <ButtonLong label="CSV 엑셀파일 템플릿 다운로드" @click="downloadCSV"/>
    <div class="item-title">
      <p class="number">02</p><p class="title">CSV 파일 업로드 및 등록</p>
    </div>
    <FileUpload width="900px" @files-selected="fetchSelectedFile" :multiple="false"/>
    <ButtonLong label="구성원 일괄 등록" @click="triggerFileInput"/>
  </div>
</template>

<style scoped>
p, hr {
  padding: 0;
  margin: 0;
}

#emp-list-register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: #3C4651;
}
#container-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 900px;
}
#header-left{
  margin-top: 20px;
}
.back-button {
  float: right;
  margin-top: 50px;
}
.container-item {
  width: 900px;
  margin-top: 20px;
}
#sub-title {
  font-size: 20px;
  padding: 0;
  margin: 0;
  height: 20px;
}
#container-title {
  font-size: 35px;
  font-weight: bold;
  color: #3C4651;
  margin-top: 10px;
}
.item-title {
  display: flex;
  gap: 20px;
  width: 900px;
  font-size: 25px;
  font-weight: bold;
  margin-top: 40px;
}
#notice-container {
  padding: 30px;
}
.number {
  color: #F37321;
}
#notice {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 300px;
  margin-bottom: 20px;
}
#notice > p {
  font-size: 25px;
  font-weight: bold;
}
#notice-item {
  display: flex;
  flex-direction: column;
  gap: 15px;
  font-size: 20px;
  color: #3C4651;
  font-weight: bold;
}

.container-item {
  border: 1px solid #AFA9A9 ;
  border-radius: 10px;
  height: 250px;
}
.item-list {
  height: 50%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  font-weight: bold;
  padding-left: 40px;
}
</style>