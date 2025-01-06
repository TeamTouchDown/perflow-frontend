<template>
  <div :class="['component-198', className]">
    <div class="text-wrapper-5">작성하기</div>
  </div>
</template>

<script>
export default {
  name: "Component198",
  props: {
    className: {
      type: String,
      default: "",
    },
  },
};
</script>

<style scoped>
.component-198 {
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

.component-198 .text-wrapper-5 {
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
