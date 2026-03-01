import React from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { MandatoryQuestionCard } from '../MandatoryQuestionCard';
import { questionAPI } from '../../../api/questionAPI';

interface Question {
  id: number;
  prompt: string;
  difficulty: number; // 1=Easy, 2=Medium, 3=Hard
  tags: string[];
  bank: number;
  choices: { [key: string]: string };
  correct_answer: string[];
  fromBank?: string; // Added for display purposes
}

interface Step4MandatoryQuestionsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (difficulty: string) => void;
  selectedBank: string;
  setSelectedBank: (bank: string) => void;
  selectedMandatoryQuestions: Set<number>;
  setSelectedMandatoryQuestions: React.Dispatch<
    React.SetStateAction<Set<number>>
  >;
  // Add props for backend data
  allQuestionBanks: any[];
  sections: any[];
  // Add props for validation and limits
  numVariants: number;
  questionsPerVariant: number;
  reuseMode: boolean;
  sectionQuestionCounts: number[];
}

export const Step4MandatoryQuestions: React.FC<
  Step4MandatoryQuestionsProps
> = ({
  searchQuery,
  setSearchQuery,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedBank,
  setSelectedBank,
  selectedMandatoryQuestions,
  setSelectedMandatoryQuestions,
  allQuestionBanks,
  sections,
  numVariants,
  questionsPerVariant,
  reuseMode,
  sectionQuestionCounts,
}) => {
  // Get all available question banks from selected sections
  const availableBanks = React.useMemo(() => {
    const bankIds = new Set<number>();
    sections.forEach((section) => {
      section.question_banks.forEach((bank: any) => {
        bankIds.add(bank.id);
      });
    });
    return allQuestionBanks.filter((bank) => bankIds.has(bank.id));
  }, [sections, allQuestionBanks]);

  // Add section filter state
  const [selectedSection, setSelectedSection] =
    React.useState<string>('All Sections');

  // Fetch real questions from backend
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchQuestions = async () => {
      if (availableBanks.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch questions for each bank
        const allQuestions: Question[] = [];

        for (const bank of availableBanks) {
          console.log(
            `Fetching questions for bank: ${bank.title} (ID: ${bank.id})`
          );

          try {
            const bankQuestions = await questionAPI.getQuestionsByBank(bank.id);
            console.log(
              `Received ${bankQuestions.length} questions for bank ${bank.title}:`,
              bankQuestions
            );

            // Add bank name to each question for display
            const questionsWithBank = bankQuestions.map((q) => ({
              ...q,
              fromBank: bank.title,
            }));

            allQuestions.push(...questionsWithBank);
          } catch (err) {
            console.error(
              `Error fetching questions for bank ${bank.title}:`,
              err
            );
            // Continue with other banks even if one fails
          }
        }

        console.log('All fetched questions:', allQuestions);
        setQuestions(allQuestions);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [availableBanks]);

  // Calculate section limits for mandatory questions
  const sectionLimits = React.useMemo(() => {
    if (reuseMode) {
      // In reuse mode, no limits on mandatory questions
      return sections.map(() => Infinity);
    }

    return sections.map((section, index) => {
      const sectionQuestionsPerVariant = sectionQuestionCounts[index] || 0;

      // In unique mode: mandatory questions must be duplicated across all variants
      // So if we have 3 variants and want 2 mandatory questions from Section A,
      // that uses 6 total questions (2 × 3 variants)
      const maxMandatoryPerSection = Math.floor(
        sectionQuestionsPerVariant / numVariants
      );
      return Math.max(0, maxMandatoryPerSection);
    });
  }, [sections, sectionQuestionCounts, numVariants, reuseMode]);

  // Calculate total mandatory questions allowed
  const totalMandatoryAllowed = React.useMemo(() => {
    return sectionLimits.reduce((sum, limit) => sum + limit, 0);
  }, [sectionLimits]);

  // Count selected mandatory questions per section
  const selectedQuestionsPerSection = React.useMemo(() => {
    const counts = new Array(sections.length).fill(0);

    selectedMandatoryQuestions.forEach((questionId) => {
      const question = questions.find((q) => q.id === questionId);
      if (question) {
        // Find which section this question belongs to
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const bankInSection = section.question_banks.find(
            (bank: any) => bank.title === question.fromBank
          );
          if (bankInSection) {
            counts[i]++;
            break;
          }
        }
      }
    });

    return counts;
  }, [selectedMandatoryQuestions, questions, sections]);

  // Calculate recommended max count
  const recommendedMax = React.useMemo(() => {
    const totalQuestions = questions.length;
    return Math.floor(totalQuestions / (numVariants * 1.5));
  }, [questions.length, numVariants]);

  // Filter questions based on search and filters
  const filteredQuestions = React.useMemo(() => {
    const filtered = questions.filter((question) => {
      const matchesSearch =
        searchQuery === '' ||
        question.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesDifficulty =
        selectedDifficulty === 'Any' ||
        (selectedDifficulty === 'Easy' && question.difficulty === 1) ||
        (selectedDifficulty === 'Medium' && question.difficulty === 2) ||
        (selectedDifficulty === 'Hard' && question.difficulty === 3);

      const matchesBank =
        selectedBank === 'All QBs' || question.fromBank === selectedBank;

      // Add section filter
      const matchesSection = (() => {
        if (selectedSection === 'All Sections') return true;

        // Find which section this question belongs to
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const bankInSection = section.question_banks.find(
            (bank: any) => bank.title === question.fromBank
          );
          if (bankInSection) {
            const sectionName = `${section.title || `Section ${String.fromCharCode(65 + i)}`}`;
            return sectionName === selectedSection;
          }
        }
        return false;
      })();

      return (
        matchesSearch && matchesDifficulty && matchesBank && matchesSection
      );
    });

    console.log('Filtered questions:', filtered);
    console.log('First filtered question (if any):', filtered[0]);

    return filtered;
  }, [
    questions,
    searchQuery,
    selectedDifficulty,
    selectedBank,
    selectedSection,
    sections,
  ]);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-heading mb-2">
            Mandatory Questions
          </h1>
          <p className="text-sm text-muted">
            Select questions that must appear in every variant.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-btn mx-auto mb-4"></div>
            <p className="text-muted">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-heading mb-2">
            Mandatory Questions
          </h1>
          <p className="text-sm text-muted">
            Select questions that must appear in every variant.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading questions</p>
            <p className="text-sm text-muted">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-heading mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="text-orange-600" size={20} />
          </div>
          Mandatory Questions
        </h1>
        <p className="text-sm text-muted">
          Select questions that must appear in every variant.
        </p>
      </div>

      <div className="flex-1 space-y-6">
        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-heading">
                Search Questions
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by question text, tags, or difficulty..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn text-base bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-heading">
                  Difficulty
                </label>
                <div className="relative">
                  <select
                    className="px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn text-base bg-white appearance-none pr-10 w-full"
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                  >
                    <option value="Any">Any Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-heading">
                  Question Bank
                </label>
                <div className="relative">
                  <select
                    className="px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn text-base bg-white appearance-none pr-10 w-full"
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                  >
                    <option value="All QBs">All Question Banks</option>
                    {availableBanks.map((bank) => (
                      <option key={bank.id} value={bank.title}>
                        {bank.title}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-heading">
                  Section
                </label>
                <div className="relative">
                  <select
                    className="px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn text-base bg-white appearance-none pr-10 w-full"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    <option value="All Sections">All Sections</option>
                    {sections.map((section, index) => (
                      <option
                        key={index}
                        value={
                          section.title ||
                          `Section ${String.fromCharCode(65 + index)}`
                        }
                      >
                        {section.title ||
                          `Section ${String.fromCharCode(65 + index)}`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Question Limits Summary */}
        {!reuseMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertTriangle className="text-blue-600" size={12} />
              </div>
              <p className="font-semibold text-blue-800 text-sm">
                Mandatory Question Limits
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-blue-700">
                You can select up to {totalMandatoryAllowed} mandatory questions
                in total without exceeding section allocations.
              </p>
              <div className="space-y-1">
                {sections.map((section, index) => {
                  const limit = sectionLimits[index] || 0;
                  return (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-blue-700">
                        {section.title ||
                          `Section ${String.fromCharCode(65 + index)}`}
                        :
                      </span>
                      <span className="text-blue-800 font-medium">
                        Up to {limit} mandatory questions
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1">
          {filteredQuestions.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted">
                No questions found matching your criteria.
              </p>
            </div>
          ) : (
            filteredQuestions.map((question) => {
              // Find which section this question belongs to
              let questionSectionIndex = -1;
              let questionSectionName = '';
              for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const bankInSection = section.question_banks.find(
                  (bank: any) => bank.title === question.fromBank
                );
                if (bankInSection) {
                  questionSectionIndex = i;
                  questionSectionName =
                    section.title || `Section ${String.fromCharCode(65 + i)}`;
                  break;
                }
              }

              // Check if this question can be selected
              const isSelected = selectedMandatoryQuestions.has(question.id);
              const isDisabled =
                questionSectionIndex >= 0 &&
                !reuseMode &&
                !isSelected && // Allow deselection of already selected questions
                selectedQuestionsPerSection[questionSectionIndex] >=
                  sectionLimits[questionSectionIndex];

              return (
                <MandatoryQuestionCard
                  key={question.id}
                  question={question}
                  isSelected={selectedMandatoryQuestions.has(question.id)}
                  isDisabled={isDisabled}
                  sectionName={questionSectionName}
                  onSelect={(questionId) => {
                    setSelectedMandatoryQuestions((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(questionId)) {
                        newSet.delete(questionId);
                      } else {
                        newSet.add(questionId);
                      }
                      return newSet;
                    });
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
