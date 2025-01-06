<script setup>

// 사용법:
// <TableBasic
//   :columns="테이블 열 정보"
//   :rows="불러오는 데이터"
//   rowKey="각 행의 고유 키"
//   :showCheckbox="true"
//   @row-selected="row 선택 후 처리하는 함수 이름"
// />

import {ref} from "vue";

const emit = defineEmits(["page-changed", "row-selected", "title-clicked"]);

const props = defineProps({
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
  showCheckbox: {
    type: Boolean,
    default: false,
  },
  columnWidths: {
    type: Array,
    default: () => [],  // 열의 폭을 배열로 입력 받기
  },
});

const selectedRows = ref(new Set());

// 체크박스 토글
const toggleRowSelection = (row) => {
  // const key = row[props.rowKey];
  const isSelected = selectedRows.value.has(row);
  if (selectedRows.value.has(row)) {
    selectedRows.value.delete(row);
  } else {
    selectedRows.value.add(row);
  }
  emit("row-selected", Array.from(selectedRows.value));
};

// row 선택되었는지 확인
const isRowSelected = (row) => selectedRows.value.has(row);

// 전체 선택/해제 토글
const toggleAllSelection = (e) => {
  if (e.target.checked) {
    props.rows.forEach((row) => selectedRows.value.add(row));
  } else {
    selectedRows.value.clear();
  }
  emit("row-selected", Array.from(selectedRows.value));
};

</script>

<template>
    <div class="table-container">
      <table class="table">
        <!--테이블 헤더-->
        <thead>
        <tr>
          <!-- 체크박스 헤더 -->
          <th v-if="showCheckbox">
            <input
                type="checkbox"
                @change="toggleAllSelection"
            />
          </th>
          <!-- 헤더 -->
          <th v-for="(column, index) in columns"
              :key="index"
              :style="{ width: columnWidths[index] || 'auto' }"
          >
            {{ column.label }}
          </th>
        </tr>
        </thead>

        <!-- 테이블 바디 -->
        <tbody>
        <tr v-for="row in rows"
            :key="row[rowKey]"
            :class="{ selected: isRowSelected(row) }"
            @click="toggleRowSelection(row)"
        >
          <!-- 개별 체크박스 -->
          <td v-if="showCheckbox">
            <input
                type="checkbox"
                :checked="isRowSelected(row)"
                @click.stop="toggleRowSelection(row)"
            />
          </td>
          <!-- 데이터 -->
          <td
              v-for="(column, index) in columns"
              :key="index"
              :style="{ width: columnWidths[index] || 'auto' }"
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
  height: 510px;
  overflow: hidden; /* 테두리 안쪽 내용 잘림 방지 */
}
.table {
  width: 900px;
  table-layout: fixed; /* 열 너비를 균일하게 유지 (필요시) */
}

/* 가운데 정렬 */
th,
td {
  text-align: center; /* 텍스트 가운데 정렬 */
  vertical-align: middle; /* 세로 가운데 정렬 */
  font-size: 15px;
}
th {
  color: #817F7F;
  font-weight: bold;
}

td {
  color: #3C4651;
}
tr {
  height: 45px;       /* 각 셀(행)의 높이 고정 */
  line-height: 20px;  /* 텍스트를 높이 중앙에 위치시키기 */
}
tr.selected {
  background-color: #F3F3F3;
}

th:first-child,
td:first-child {
  width: 5px; /* 원하는 너비로 조정 */
  text-align: center; /* 체크박스 가운데 정렬 */
  padding-left: 30px;
}

/* 체크박스 관련 css 설정 -------*/

/* 체크박스 기본 스타일 제거 및 커스텀 스타일 적용 */
input[type="checkbox"] {
  /* 기본 스타일 제거 */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  /* 커스텀 체크박스 스타일 */
  width: 13px; /* 체크박스 너비 */
  height: 13px; /* 체크박스 높이 */
  border: 2px solid #AFA9A9; /* 체크박스 테두리 색상 */
  border-radius: 3px; /* 모서리 둥글게 */
  outline: none;
  cursor: pointer;
  background-color: white; /* 체크되지 않았을 때 배경색 */
  display: inline-block;
  position: relative;
}

/* 체크된 상태의 스타일 */
input[type="checkbox"]:checked {
  background-color: #D9D9D9;
  border-color: #AFA9A9;
}

/* 체크된 상태에서 체크마크 추가 */
input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  top: 1px;
  left: 3.5px;
  width: 3px;
  height: 8px;
  border: solid white; /* 체크마크 색상 */
  border-width: 0 2px 2px 0;
  transform: rotate(45deg); /* 체크마크를 기울임 */
}

</style>