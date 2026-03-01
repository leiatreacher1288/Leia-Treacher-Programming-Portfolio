import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useState, useEffect } from 'react';
import { Plus, Edit2 } from 'lucide-react';

// Course table structure
interface courseField {
  id: number;
  user: number;
  name: string;
  term: string;
  code: string;
  last_edited: string;
  instructor_count: number;
}

// Question Bank table structure
interface questionbankField {
  id: number; // PK of the table
  course: number; // FK to the Course table
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  question_count: number;
}

// Question Bank
export const QuestionBank = () => {
  // Parameter passed in by the path route
  // course_id is the PK for the Course model
  const { course_id } = useParams<{ course_id: string }>();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<courseField | null>(null);
  const [title, setTitle] = useState('');
  const [id, setId] = useState<number | null>(null);
  const [questionbanks, setQuestionBanks] = useState<Array<questionbankField>>(
    []
  );
  const [add_questionbank, setAddQuestionBank] = useState<'edit' | null>(null);

  // Handle the cancel button when editing a Question Bank
  const handleQuestionBankCancel = () => {
    setAddQuestionBank(null);
    // reset the two input fields to default
    setTitle('');
    setId(null);
  };

  // Get the array of all Question Bank for a specific Course
  // defined by course_id
  const GetQuestionBank = async () => {
    console.log('get question bank list');
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `questions/${course_id}/questionbank-course`
      );
      setQuestionBanks(res.data);
      console.log('data = ', res.data);
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle the button click event of the Save button.
  // if id(PK of the Question Bank) is null then it is a
  // new Question Bank so POST is called if not it is an update
  // of an existing Question Bank and a PATCH is called
  const handleQuestionBankSave = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setLoading(true);
    // if id (question bank id) is null it means this is a new question bank
    // so a post request is done to the backend, else a patch request is done
    // to the backend to update the question bank information.
    if (id == null) {
      try {
        console.log('Adding new row to the Question Bank');
        const res = await axiosInstance.post('questions/questionbank-detail/', {
          course: course_id,
          title,
        });
        if (res.status === 200)
          console.log('Question Bank created successfully');
      } catch (error) {
        alert(error);
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Updating existing Question Bank');
      try {
        const res = await axiosInstance.put(
          `questions/${id}/questionbank-detail`,
          { title }
        );
        if (res.status === 200)
          console.log('Question Bank updated successfully');
      } catch (error) {
        alert(error);
      } finally {
        setLoading(false);
      }
    }
    // set the flag to null from 'edit'.  So rendering will not
    // display the add/edit queston bank option
    setAddQuestionBank(null); // set the flag to null for rendering
    // set the temporary fields back to default
    setTitle('');
    setId(null);
    // make a call to the backend to get a new list of Question Bank
    // list from the backend
    GetQuestionBank();
  };

  // Handle the delete button to delete a row from the
  // Question Bank.
  const handleQuestionBankDelete = async (id: number) => {
    setLoading(true);
    try {
      const res = await axiosInstance.delete(
        `questions/${id}/questionbank-detail`
      );
      console.log('resources = ', res);
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);

      setAddQuestionBank(null); // set the flag to null for rendering
      // set the fields back to default
      setTitle('');
      setId(null);
      // make a call to the backend to get the list of Question Bank
      GetQuestionBank();
    }
  };

  // handle the edit and adding of Question Bank
  const handleQuestionBankDetail = (tmp_questionbank: questionbankField) => {
    // set the temporary fields to the current selected question bank
    // fields for display.
    setTitle(tmp_questionbank.title);
    setId(tmp_questionbank.id);

    // set the rendering flag to edit to render the Question Bank fields
    setAddQuestionBank('edit');
  };

  // Get the Course from the backend once and avoid calling
  // GetCourse everytime the screen is rendered
  useEffect(() => {
    if (!course_id) return; // no course yet → skip
    setLoading(true);

    async function fetchCourse() {
      try {
        const res = await axiosInstance.get(`courses/${course_id}/detail`);
        setCourse(res.data);
      } catch (err) {
        console.error('Error loading course:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [course_id]);

  useEffect(() => {
    if (!course_id) return; // no course yet → skip
    setLoading(true);

    async function fetchBanks() {
      try {
        const res = await axiosInstance.get(
          `questions/${course_id}/questionbank-course`
        );
        setQuestionBanks(res.data);
      } catch (err) {
        console.error('Error loading question banks:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBanks();
  }, [course_id]);

  // check if the tables are still loading from the backend
  // if so then don't render the screen yet.
  if (loading) {
    console.log('loading Question Bank Page...');
    return <h1>Loading...</h1>;
  }

  return (
    <div className="w-screen px-8 pt-20 pb-8">
      <h1 className="pt-10 text-3xl font-bold mb-6 text-center">
        Question Bank
      </h1>
      {course !== null && (
        <h1 className="text-3xl text-left font-bold">
          Course: {course.name} - {course.term}
        </h1>
      )}

      {questionbanks.length === 0 && (
        <h2 className="text-center">You have no question bank</h2>
      )}
      {add_questionbank === 'edit' ? (
        <div>
          <h2>Add/Edit question bank</h2>
          <div>
            {id !== null && (
              <div>
                <p>
                  <strong>Id:</strong> {id}
                </p>
              </div>
            )}
            <label htmlFor="ClassName" className="mt-3 block font-medium mb-1">
              Question bank name:
            </label>
            <input
              className="w-2/3 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              id="questionbank_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="py-4 space-x-8">
            <button
              onClick={(e) => handleQuestionBankSave(e)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Save
            </button>
            <button
              onClick={handleQuestionBankCancel}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="my-4">
          <button
            className="flex items-center bg-blue-600 text-white py-2 px-2 rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={() => setAddQuestionBank('edit')}
          >
            <Plus className="w-4 h-4" />
            <span>Add Question Bank</span>
          </button>
        </div>
      )}
      <div className="border  px-4 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questionbanks.map((questionbank: questionbankField) => (
          <div
            className="bg-white w-[100%] h-[100%] p-6 rounded-2xl shadow-md max-w-sm mx-auto"
            key={questionbank.id}
          >
            <div className="relative overflow-hidden rounded-xl bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop"
                alt={`${questionbank.title} banner`}
                className="w-full h-32 object-cover"
              />
            </div>

            <div className="flex-1 mt-4">
              <h3 className="font-semibold text-gray-900 leading-tight text-lg mb-1">
                {questionbank.title}
                <button
                  onClick={() => handleQuestionBankDetail(questionbank)}
                  className={'float-right'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </h3>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    {questionbank.question_count}{' '}
                    {questionbank.question_count === 0
                      ? 'Question'
                      : 'Questions'}{' '}
                  </span>
                </div>
              </div>
            </div>
            {/* Buttons Row */}
            <div className="flex flex-wrap gap-2 mb-5">
              <Link
                to={`/question/${questionbank.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition"
              >
                Questions
              </Link>
              <button
                onClick={() => {
                  const confirmed = window.confirm(
                    `Are you sure you want to delete "${questionbank.title}"?`
                  );
                  if (confirmed) {
                    handleQuestionBankDelete(questionbank.id);
                  }
                }}
                className=" flex-1 flex items-center justify-center text-sm bg-red-600 text-white  rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
