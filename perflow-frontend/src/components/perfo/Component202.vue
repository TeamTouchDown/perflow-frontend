<template>
  <div :class="['component-202', className]">
    <div class="text-wrapper-9">수정하기</div>
  </div>
</template>

<script>
export default {
  name: "Component202",
  props: {
    className: {
      type: String,
      default: "",
    },
  },
};
</script>

<style scoped>
.component-202 {
  background: linear-gradient(
      180deg,
      rgb(243, 115, 33) 0%,
      rgb(255, 187, 0) 100%
  );
  border-radius: 5px;
  height: 41px;
  position: relative;
  width: 132px;
}

.component-202 .text-wrapper-9 {
  color: #ffffff;
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
