import { useAuth } from '../context/AuthContext';

export const CreateExam = () => {
  // run the hook for auth guarding; we don't need its return value yet
  useAuth();

  return (
    <div className="w-screen px-4 pt-20 pb-8">
      <h2 className="text-3xl font-semibold mb-4 text-center">Create Exam</h2>
      {/* TODO: add exam-creation form here */}
    </div>
  );
};
