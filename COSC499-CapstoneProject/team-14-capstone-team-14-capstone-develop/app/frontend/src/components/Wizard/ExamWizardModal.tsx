import React, { useState } from 'react';
import { FileText, Book, BarChart3, Pin, CheckCircle2, X } from 'lucide-react';
import { OverviewSummaryCard } from '../cards/OverviewSummaryCard';
import { StandardButton } from '../ui/StandardButton';
import { DifficultyCard } from '../ExamConfig/DifficultyCard';

interface ExamWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam?: any;
}

const STEPS = [
  {
    label: 'Exam Info',
    icon: <FileText size={22} className="text-primary-btn" />,
  },
  {
    label: 'Sections & Banks',
    icon: <Book size={22} className="text-accent-indigo" />,
  },
  {
    label: 'Difficulty & Config',
    icon: <BarChart3 size={22} className="text-accent-emerald" />,
  },
  {
    label: 'Mandatory Questions',
    icon: <Pin size={22} className="text-accent-pink" />,
  },
  {
    label: 'Review & Generate',
    icon: <CheckCircle2 size={22} className="text-success-btn" />,
  },
];

export const ExamWizardModal: React.FC<ExamWizardModalProps> = ({
  isOpen,
  onClose,
  exam,
}) => {
  // All hooks at the top
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  // Dummy state for prototype
  const [examInfo, setExamInfo] = useState({
    title: exam?.title || '',
    description: exam?.description || '',
    date: '',
    type: 'midterm',
  });
  const [sections, setSections] = useState([
    {
      title: 'Section 1',
      banks: ['Bank A', 'Bank B'],
      numQuestions: 10,
      instructions: '',
    },
  ]);
  const [difficultyMode, setDifficultyMode] = useState<'auto' | 'even' | null>(
    null
  );
  const [mandatoryQuestions, setMandatoryQuestions] = useState<string[]>([]);

  if (!isOpen) {
    return null;
  }

  // Stepper UI
  const renderStepper = () => (
    <div className="flex items-center justify-center gap-4 mb-8">
      {STEPS.map((s, idx) => (
        <React.Fragment key={s.label}>
          <div className="flex flex-col items-center">
            <div
              className={`rounded-full border-2 flex items-center justify-center w-12 h-12 transition-all duration-300
                ${
                  idx < step
                    ? 'bg-success-btn border-success-btn text-white shadow-lg'
                    : idx === step
                      ? 'bg-primary-btn border-primary-btn text-white scale-110 shadow-xl'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                }
              `}
            >
              {s.icon}
            </div>
            <span
              className={`mt-2 text-xs font-semibold transition-colors duration-300
                ${idx === step ? 'text-primary-btn' : idx < step ? 'text-success-btn' : 'text-gray-400'}`}
            >
              {s.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`h-1 w-8 rounded-full transition-all duration-300
                ${idx < step ? 'bg-success-btn' : 'bg-gray-200'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Step content
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <OverviewSummaryCard
            accent="blue"
            className="w-full max-w-xl mx-auto"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="text-primary-btn" /> Exam Info
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  className="w-full px-3 py-2 border rounded bg-background"
                  value={examInfo.title}
                  onChange={(e) =>
                    setExamInfo({ ...examInfo, title: e.target.value })
                  }
                  placeholder="Exam Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded bg-background"
                  value={examInfo.description}
                  onChange={(e) =>
                    setExamInfo({ ...examInfo, description: e.target.value })
                  }
                  placeholder="Exam Description"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded bg-background"
                    value={examInfo.date}
                    onChange={(e) =>
                      setExamInfo({ ...examInfo, date: e.target.value })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded bg-background"
                    value={examInfo.type}
                    onChange={(e) =>
                      setExamInfo({ ...examInfo, type: e.target.value })
                    }
                  >
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                    <option value="quiz">Quiz</option>
                    <option value="practice">Practice</option>
                  </select>
                </div>
              </div>
            </div>
          </OverviewSummaryCard>
        );
      case 1:
        return (
          <OverviewSummaryCard
            accent="purple"
            className="w-full max-w-xl mx-auto"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Book className="text-accent-indigo" /> Sections & Banks
            </h3>
            <div className="space-y-4">
              {sections.map((section, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-2 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-primary-btn">
                      Section {idx + 1}:
                    </span>
                    <input
                      className="flex-1 px-2 py-1 border rounded bg-background"
                      value={section.title}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[idx].title = e.target.value;
                        setSections(updated);
                      }}
                      placeholder="Section Title"
                    />
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input
                      className="flex-1 px-2 py-1 border rounded bg-background"
                      value={section.banks.join(', ')}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[idx].banks = e.target.value
                          .split(',')
                          .map((s) => s.trim());
                        setSections(updated);
                      }}
                      placeholder="Banks (comma separated)"
                    />
                    <input
                      type="number"
                      min={1}
                      className="w-24 px-2 py-1 border rounded bg-background"
                      value={section.numQuestions}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[idx].numQuestions = Number(e.target.value);
                        setSections(updated);
                      }}
                      placeholder="# Questions"
                    />
                  </div>
                  <div>
                    <textarea
                      className="w-full px-2 py-1 border rounded bg-background"
                      value={section.instructions}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[idx].instructions = e.target.value;
                        setSections(updated);
                      }}
                      placeholder="Section Instructions (optional)"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <StandardButton
                color="secondary-blue"
                icon={<Book size={16} />}
                onClick={() =>
                  setSections([
                    ...sections,
                    {
                      title: `Section ${sections.length + 1}`,
                      banks: [],
                      numQuestions: 5,
                      instructions: '',
                    },
                  ])
                }
              >
                Add Section
              </StandardButton>
            </div>
          </OverviewSummaryCard>
        );
      case 2:
        return (
          <OverviewSummaryCard
            accent="green"
            className="w-full max-w-xl mx-auto"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="text-accent-emerald" /> Difficulty & Config
            </h3>
            <div className="mb-6">
              <DifficultyCard
                selectedMode={difficultyMode}
                setSelectedMode={setDifficultyMode}
                savedDistribution={{
                  Easy: 33,
                  Medium: 33,
                  Hard: 34,
                  Unknown: 0,
                }}
                setEnabled={() => {}}
                onSave={() => {}}
                isSaving={false}
                saveStatus="idle"
                questions={[]}
                questionsPerVariant={10}
                numVariants={2}
                allowReuse={true}
                enabled={true}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Number of Variants
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 border rounded bg-background"
                  value={2}
                  readOnly
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Time Limit (min)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border rounded bg-background"
                  value={60}
                  readOnly
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked readOnly /> Randomize Questions
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked readOnly /> Randomize Choices
              </label>
            </div>
          </OverviewSummaryCard>
        );
      case 3:
        return (
          <OverviewSummaryCard accent="red" className="w-full max-w-xl mx-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Pin className="text-accent-pink" /> Mandatory Questions
            </h3>
            <div className="space-y-2">
              {[...Array(5)].map((_, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mandatoryQuestions.includes(`Q${idx + 1}`)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setMandatoryQuestions([
                          ...mandatoryQuestions,
                          `Q${idx + 1}`,
                        ]);
                      else
                        setMandatoryQuestions(
                          mandatoryQuestions.filter((q) => q !== `Q${idx + 1}`)
                        );
                    }}
                  />
                  <span className="text-heading">Question {idx + 1}</span>
                </label>
              ))}
            </div>
          </OverviewSummaryCard>
        );
      case 4:
        return (
          <OverviewSummaryCard
            accent="green"
            className="w-full max-w-xl mx-auto"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-success-btn" /> Review & Generate
            </h3>
            <div className="mb-4">
              <div className="font-semibold mb-2">Exam Info</div>
              <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                {examInfo.title} — {examInfo.type}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {examInfo.description}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Date: {examInfo.date || 'N/A'}
              </div>
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-2">Sections</div>
              {sections.map((s, idx) => (
                <div key={idx} className="mb-1 text-sm">
                  <span className="font-medium text-primary-btn">
                    {s.title}
                  </span>{' '}
                  — {s.banks.join(', ')} ({s.numQuestions} questions)
                  {s.instructions && (
                    <div className="text-xs text-gray-500">
                      Instructions: {s.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-2">Mandatory Questions</div>
              <div className="text-sm text-gray-700 dark:text-gray-200">
                {mandatoryQuestions.length > 0
                  ? mandatoryQuestions.join(', ')
                  : 'None'}
              </div>
            </div>
            <div className="flex justify-end">
              <StandardButton
                color="success-btn"
                size="lg"
                icon={<CheckCircle2 size={20} />}
                onClick={() => {
                  setSaving(true);
                  setTimeout(() => {
                    setSaving(false);
                    onClose();
                  }, 1200);
                }}
                disabled={saving}
                className="px-8 py-3 text-lg shadow-lg"
              >
                {saving ? 'Generating...' : 'Generate Exam'}
              </StandardButton>
            </div>
          </OverviewSummaryCard>
        );
      default:
        return null;
    }
  };

  // Modal wrapper
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="relative bg-card dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto p-0 overflow-hidden animate-fadeInUp">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 shadow"
          onClick={onClose}
          aria-label="Close wizard"
        >
          <X size={22} />
        </button>
        <div className="px-8 pt-8 pb-6">
          {renderStepper()}
          <div className="min-h-[340px] flex flex-col justify-between">
            {renderStep()}
            <div className="flex justify-between mt-8 gap-4">
              <StandardButton
                color="secondary-btn"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0 || saving}
              >
                Back
              </StandardButton>
              {step < STEPS.length - 1 && (
                <StandardButton
                  color="primary-btn"
                  onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
                  disabled={saving}
                >
                  Next
                </StandardButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
