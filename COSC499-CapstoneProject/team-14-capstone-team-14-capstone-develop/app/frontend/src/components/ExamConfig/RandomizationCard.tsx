import { Shuffle } from 'lucide-react';
import { SectionTitle } from '../cards/SectionTitle';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { useState } from 'react';

export const RandomizationCard = () => {
  const [shuffleAnswers, setShuffleAnswers] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-md mb-3 p-6">
      <SectionTitle
        icon={<Shuffle size={20} stroke="#6366F1" />}
        title="Randomization Options"
      />

      <div className="border border-gray-200 rounded-xl mt-4 divide-y divide-gray-200">
        {/* Shuffle Answers */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex-1 pr-4">
            <h3 className="font-medium text-heading">Shuffle Answers</h3>
            <p className="text-sm text-gray-500">
              Randomize the order of answer choices for multiple-choice
              questions.
            </p>
          </div>
          <ToggleSwitch
            enabled={shuffleAnswers}
            onToggle={() => setShuffleAnswers(!shuffleAnswers)}
          />
        </div>
      </div>
    </div>
  );
};
