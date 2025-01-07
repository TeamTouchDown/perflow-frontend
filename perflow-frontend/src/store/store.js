import {defineStore} from 'pinia';
import {computed, ref} from "vue";
import api from "@/config/axios.js";

// 부서와 하위 부서의 id 수집
function collectSubDeptIds(deptId, allDepartments) {

    const result = [deptId];
    // 하위 부서 찾기
    const children = allDepartments.filter(dept => dept.managedDeptId === deptId);

    // 재귀적으로 하위 부서 탐색
    for (const child of children) {
        result.push(...collectSubDeptIds(child.deptId, allDepartments));
    }

    return result;
}

export const useStore = defineStore('store', {
    state: () => ({
        allDepartment: ref([]),
        allEmployee: ref({}),
        allMenu: ref([]),
        currentDept: ref(null), // 현재 선택한 부서
        currentEmployees: ref([]),   // 선택된 부서와 하위 부서의 사원
        company: ref({}),
        isLoading: ref(false)
    }),
    actions: {
        // 조직도 갱신
        async fetchOrg() {
            this.allDepartment = (await api.get("/departments/list")).data;
        },
        // 선택 부서와 하위 부서의 사원 정보 가져오기
        async selectDept(deptId) {
            // 현재 부서, 하위 부서 id 가져오기
            const departmentIds = collectSubDeptIds(deptId, this.allDepartment);

            // 각 부서 ID에 대해 API 요청 보내기
            const promises = departmentIds.map(id => api.get("/employees/depts", {
                params: { departmentId: id } // 부서 ID 개별 요청
            }));

            // 모든 요청 처리
            const responses = await Promise.all(promises);

            // 모든 응답 데이터를 하나의 배열로
            this.currentEmployees = responses.flatMap(response => response.data);

        },
        // 선택 부서 사원 추가
        async addEmp(deptId) {
            const response = await api.get("/employees/depts", {
                params: {
                    departmentId: deptId // 숫자로 전송
                }
            });

            // allEmployee.value가 정의되지 않았으면 초기화
            if (!this.allEmployee.value) {
                this.allEmployee.value = {};
            }

            this.allEmployee.value[deptId] = response.data; // 객체로 저장
        },
        // 선택 부서 사원 삭제
        async removeEmp(deptId) {
            delete this.allEmployee.value[deptId]; // 객체에서 해당 키 삭제
        },
        async fetchMenu(){
            this.allMenu = (await api.get("/menu")).data;
        },
        async fetchCompany() {
            this.company = (await api.get("/company")).data;
        },
        clearAll() {
            this.allEmployee.value= null;
        },
        showLoading() {
            this.isLoading = true;
        },
        hideLoading() {
            this.isLoading = false;
        }
    },
    persist:true
});