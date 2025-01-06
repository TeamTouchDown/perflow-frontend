import api from '@/config/axios.js';

/* 결재 문서 생성 api */
/* 1. 기본 서식 */

export const createNewDocument = async (docData) => {
    try {
        const response = await api.post('/approval/docs', docData);
        return response.data;
    } catch (error) {
        console.error('결재 문서 생성 api 호출 실패: ', error);
        throw error;
    }
}