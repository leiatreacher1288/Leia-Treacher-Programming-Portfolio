import { questionAPI } from '../api/questionAPI';

export const validateCourseHasQuestionBanks = async (
  courseId: number
): Promise<boolean> => {
  try {
    const questionBanks = await questionAPI.getQuestionBanksByCourse(courseId);
    return questionBanks.length > 0;
  } catch (error) {
    console.error('Error validating course question banks:', error);
    return false;
  }
};
