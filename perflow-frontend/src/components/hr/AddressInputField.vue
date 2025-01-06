<script setup>
import {onMounted, reactive, ref, watch} from "vue";

// 상태 관리

// Emit 정의: 'update-value' 이벤트를 부모에게 전달
const emit = defineEmits(['update-value']);

// 반응형 객체로 totalAddress 정의
const totalAddress = reactive({
  postcode: '',
  roadAddress: '',
  extraAddress: ''
});

// 입력값이 변경될 때마다 부모에게 emit
watch(totalAddress, (newVal) => {
  emit('update-value', { ...newVal }); // 객체 복사하여 전달
}, { deep: true });

// 각 입력 필드의 변경 핸들러
function onAddressNumberChange(event) {
  totalAddress.postcode = event.target.value;
}

function onRoadAddressChange(event) {
  totalAddress.roadAddress = event.target.value;
}

function onExtraAddressChange(event) {
  totalAddress.extraAddress = event.target.value;
}

// 함수 정의
function execDaumPostcode() {
  new daum.Postcode({
    oncomplete: function (data) {
      // 도로명 주소 변수
      let roadAddr = data.roadAddress
      let extraRoadAddr = ''

      // 법정동명이 있을 경우 추가
      if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
        extraRoadAddr += data.bname
      }
      // 건물명이 있고, 공동주택일 경우 추가
      if (data.buildingName !== '' && data.apartment === 'Y') {
        extraRoadAddr +=
            extraRoadAddr !== ''
                ? ', ' + data.buildingName
                : data.buildingName
      }

      // 우편번호와 주소 정보를 해당 필드에 넣음
      totalAddress.postcode = data.zonecode
      totalAddress.roadAddress = roadAddr
    },
  }).open()
}
onMounted(() => {
  if (!window.daum) {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => {
      console.log('다음 우편번호 스크립트가 로드되었습니다.')
      // 스크립트 로드 완료 후 실행할 코드
    }
    document.head.appendChild(script)
  } else {
    console.log('다음 우편번호 스크립트가 이미 로드되어 있습니다.')
  }
})

</script>

<template>
  <div id="address-input-container">
  <p id="title">주소</p>
    <div>
      <input type="text" class="input-address-number" placeholder="우편번호" v-model="totalAddress.postcode" @input="onAddressNumberChange">
      <input type="button" @click="execDaumPostcode" value="우편번호 찾기" id="address-button"><br>
    </div>
    <input type="text" class="input-address" placeholder="도로명주소" v-model="totalAddress.roadAddress" @input="onRoadAddressChange">
    <span id="guide" style="color:#999;display:none"></span>
    <input type="text" class="input-address" placeholder="상세주소" v-model="totalAddress.extraAddress" @input="onExtraAddressChange">
  </div>
</template>

<style scoped>
#address-input-container{
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.input-address-number {
  width: 200px;
  height: 40px;
  margin-right: 10px;
  border-radius: 5px;
  border: 1px solid #D9D9D9;
  padding: 5px;
}
.input-address {
  width: 350px;
  height: 40px;
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #D9D9D9;
}
#address-button {
  background-color: white;
  border-radius: 5px;
  height: 40px;
}
#title {
  font-weight: bold;
  margin-bottom: 10px;
}
</style>