<template>
  <div :class="['div-wrapper', className]">
    <div class="div"></div>

    <div class="text-wrapper">한동주</div>

    <div class="text-wrapper-2">서버 담당자</div>

    <div class="text-wrapper-3">서버1팀</div>

    <div class="text-wrapper-4">대리</div>
  </div>
</template>

<script>
export default {
  name: "DivWrapper",
  props: {
    className: {
      type: String,
      default: "",
    },
  },
};
</script>

<style scoped>
.div-wrapper {
  height: 106px;
  position: relative;
  width: 501px;
}

.div-wrapper .div {
  background-color: #d9d9d9;
  border-radius: 53px;
  height: 106px;
  left: 0;
  position: absolute;
  top: 0;
  width: 106px;
}

.div-wrapper .text-wrapper {

  font-family: "Noto Sans KR", Helvetica;
  font-size: 36px;
  font-weight: 700;
  height: 38px;
  left: 174px;
  letter-spacing: 0;
  line-height: normal;
  position: absolute;
  top: 18px;
  white-space: nowrap;
  width: 112px;
}

.div-wrapper .text-wrapper-2 {

  font-family: "Noto Sans KR", Helvetica;
  font-size: 20px;
  font-weight: 700;
  height: 26px;
  left: 178px;
  letter-spacing: 0;
  line-height: normal;
  position: absolute;
  top: 58px;
  width: 189px;
}

.div-wrapper .text-wrapper-3 {

  font-family: "Noto Sans KR", Helvetica;
  font-size: 20px;
  font-weight: 700;
  height: 29px;
  left: 293px;
  letter-spacing: 0;
  line-height: normal;
  position: absolute;
  top: 27px;
  width: 80px;
}

.div-wrapper .text-wrapper-4 {

  font-family: "Noto Sans KR", Helvetica;
  font-size: 20px;
  font-weight: 700;
  height: 29px;
  left: 388px;
  letter-spacing: 0;
  line-height: normal;
  position: absolute;
  top: 27px;
  width: 53px;
}
</style>
