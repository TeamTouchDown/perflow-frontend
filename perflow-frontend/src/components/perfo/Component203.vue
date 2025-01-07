<template>
  <div :class="['component-203', className]">
    <div class="text-wrapper-10">이미 평가를 작성하였어요!</div>

    <DivWrapper class="component-197-instance" />
    <Component201 class="component-201-instance" />
    <Component202 class="component-202-instance" />
  </div>
</template>

<script>
import DivWrapper from "@/components/perfo/DivWrapper.vue";
import Component201 from "@/components/perfo/Component201.vue";
import Component202 from "@/components/perfo/Component202.vue";

export default {
  name: "Component203",
  props: {
    className: {
      type: String,
      default: "",
    },
  },
  components: {
    DivWrapper,
    Component201,
    Component202,
  },
};
</script>

<style scoped>
.component-203 {
  background-color: #ffffff;
  border: 1px solid;
  border-color: #000000;
  border-radius: 10px;
  height: 149px;
  position: relative;
  width: 1235px;
}

.component-203 .text-wrapper-10 {
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

.component-203 .component-197-instance {
  left: 31px !important;
  position: absolute !important;
  top: 21px !important;
}

.component-203 .component-201-instance {
  left: 936px !important;
  position: absolute !important;
  top: 74px !important;
}

.component-203 .component-202-instance {
  left: 1085px !important;
  position: absolute !important;
  top: 74px !important;
}
</style>
