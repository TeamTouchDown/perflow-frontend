<template>
  <div :class="['component-201', className]">
    <div class="text-wrapper-8">작성하기</div>
  </div>
</template>

<script>
export default {
  name: "Component201",
  props: {
    className: {
      type: String,
      default: "",
    },
  },
};
</script>

<style scoped>
.component-201 {
  background-color: #d9d9d9;
  border-radius: 5px;
  height: 41px;
  position: relative;
  width: 132px;
}

.component-201 .text-wrapper-8 {
  font-family: "Noto Sans KR", Helvetica;
  font-size: 18px;
  font-weight: 700;
  height: 26px;
  left: 33px;
  letter-spacing: 0;
  line-height: normal;
  position: absolute;
  text-align: center;
  top: 7px;
  width: 67px;
}
</style>
