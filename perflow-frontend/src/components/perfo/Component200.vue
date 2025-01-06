<template>
  <div :class="['component-200', className]">
    <div class="text-wrapper-7">아직 평가를 작성하지 않았어요!</div>

    <DivWrapper class="component-197" />
    <Component198 class="component-198-instance" />
    <Component199 class="component-199-instance" />
  </div>
</template>

<script>
import DivWrapper from "@/components/perfo/DivWrapper.vue";
import Component198 from "@/components/perfo/Component198.vue";
import Component199 from "@/components/perfo/Component199.vue";

export default {
  name: "Component200",
  props: {
    className: {
      type: String,
      default: "",
    },
  },
  components: {
    DivWrapper,
    Component198,
    Component199,
  },
};
</script>

<style scoped>
.component-200 {
  background-color: #ffffff;
  border: 1px solid;
  border-color: #000000;
  border-radius: 10px;
  height: 149px;
  position: relative;
  width: 1235px;
}

.component-200 .text-wrapper-7 {
  font-family: "Noto Sans KR", Helvetica;
  font-size: 20px;
  font-weight: 700;
  height: 29px;
  left: 936px;
  letter-spacing: 0;
  line-height: normal;
  position: absolute;
  top: 29px;
  width: 298px;
}

.component-200 .component-197 {
  left: 31px !important;
  position: absolute !important;
  top: 21px !important;
}

.component-200 .component-198-instance {
  left: 936px !important;
  position: absolute !important;
  top: 74px !important;
}

.component-200 .component-199-instance {
  left: 1085px !important;
  position: absolute !important;
  top: 74px !important;
}
</style>
