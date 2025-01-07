<script setup>

import PagingBar from "@/components/common/PagingBar.vue";

const emit = defineEmits(["page-changed"]);

defineProps({
  // 열 정보
  columns: {
    type: Array,
    required: true,
    default: () => [],
  },
  // 행 정보
  rows: {
    type: Array,
    required: true,
    default: () => [],
  },
  // 각 행의 고유 키 (ex: "id")
  rowKey: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="table-container">
    <table class="table">

      <!--테이블 헤더-->
      <thead>
      <tr>
        <th v-for="(column, index) in columns"
            :key="index"
        >
          {{ column.label }}
        </th>
      </tr>
      </thead>

      <!-- 테이블 바디 -->
      <tbody>
      <tr v-for="row in rows" :key="row[rowKey]">
        <td
            v-for="(column, index) in columns"
            :key="index"
        >
          <!-- 슬롯을 사용하여 특정 열의 렌더링 커스터마이징 -->
          <slot
              :name="column.field"
              :row="row"
              :value="row[column.field]"
          >
            {{ row[column.field] }}
          </slot>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* 테이블 바깥 테두리 */
.table-container {
  border: 1px solid #AFA9A9; /* 바깥 테두리 색상 */
  border-radius: 10px;
  height: 500px;
  overflow: hidden; /* 테두리 안쪽 내용 잘림 방지 */
}
.table {
  width: 900px;
  table-layout: fixed; /* 열 너비를 균일하게 유지 (필요시) */
}

/* 가운데 정렬 */
th,
td {
  text-align: center; /* 텍스트 가운데w 정렬 */
  vertical-align: middle; /* 세로 가운데 정렬 */
  font-size: 15px;
}
th {
  color: #3C4651;
  font-weight: bold;
}

td {
  color: #3C4651;
}
tr {
  height: 45px;       /* 각 셀(행)의 높이 고정 */
  line-height: 20px;  /* 텍스트를 높이 중앙에 위치시키기 */
}

</style>