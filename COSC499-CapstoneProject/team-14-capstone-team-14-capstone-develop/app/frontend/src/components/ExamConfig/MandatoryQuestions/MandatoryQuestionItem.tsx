import { CheckCircle, PlusCircle, Pin } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  id: number;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  subject: string;
  selected: boolean;
  onToggle: () => void;
}

const difficultyColors = {
  Easy: 'bg-accent-emerald text-white',
  Medium: 'bg-accent-amber text-white',
  Hard: 'bg-accent-indigo text-white',
};

const subjectColors: Record<string, string> = {
  Geography: 'bg-logo-indigo text-white',
  Biology: 'bg-blue-500 text-white',
  Algebra: 'bg-rose-400 text-white',
  Physics: 'bg-logo-indigo text-white',
  Art: 'bg-accent-emerald text-white',
};

const MandatoryQuestionItem = ({
  text,
  difficulty,
  subject,
  selected,
  onToggle,
}: Props) => {
  return (
    <div
      className={clsx(
        'flex items-start p-4 rounded-lg shadow-sm cursor-pointer transition-all border relative',
        selected
          ? 'border-logo-indigo bg-indigo-50'
          : 'border-input-border bg-white'
      )}
      onClick={onToggle}
    >
      {/* Colored left stripe */}
      <div
        className={clsx(
          'w-1.5 rounded-l-md absolute top-0 bottom-0 left-0',
          selected ? 'bg-logo-indigo' : 'bg-input-border'
        )}
      />

      {/* Pin / Plus icon */}
      <div className="flex-shrink-0 mr-3 mt-0.5">
        {selected ? (
          <Pin className="text-logo-indigo w-5 h-5" />
        ) : (
          <PlusCircle className="text-search-icon w-5 h-5" />
        )}
      </div>

      <div className="flex-1">
        <p className="text-heading font-medium mb-2">{text}</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <span
            className={`px-2 py-0.5 rounded-full ${difficultyColors[difficulty]}`}
          >
            {difficulty}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full ${subjectColors[subject] || 'bg-gray-300 text-white'}`}
          >
            {subject}
          </span>
        </div>
      </div>

      {/* Right checkmark icon */}
      {selected && (
        <CheckCircle className="w-6 h-6 text-accent-emerald self-center ml-3" />
      )}
    </div>
  );
};

export default MandatoryQuestionItem;
