import React from 'react';
import { NivoPieChart } from '../Analytics/charts/nivo/NivoPieChart';
import { NivoRadialProgress } from '../Analytics/charts/nivo/NivoRadialProgress';
import type { ExamDetail } from '../../api/examAPI';

type MainScore = {
  value: number;
  label: string;
};

function getMainScore(analytics: any): MainScore {
  const fields = [
    { key: 'final_score', label: 'Final Score' },
    { key: 'cheating_risk', label: 'Cheating Risk' },
    { key: 'answer_diversity', label: 'Answer Diversity' },
    { key: 'variant_uniqueness', label: 'Variant Uniqueness' },
    { key: 'question_reuse_rate', label: 'Question Reuse Rate' },
    { key: 'mandatory_overlap', label: 'Mandatory Overlap' },
  ];

  const components = fields
    .map(({ key, label }) => {
      const v = analytics[key];
      return typeof v === 'number' ? { label, value: v } : null;
    })
    .filter((c): c is { label: string; value: number } => Boolean(c));

  if (components.length === 0) return { value: 0, label: 'Exam Integrity' };

  let sum = 0;
  let count = 0;
  components.forEach(({ label, value }) => {
    if (
      label === 'Cheating Risk' ||
      label === 'Question Reuse Rate' ||
      label === 'Mandatory Overlap'
    ) {
      sum += 100 - value; // lower is better
    } else {
      sum += value; // higher is better
    }
    count++;
  });

  return {
    value: Math.round(sum / count),
    label: 'Exam Integrity',
  };
}

function getDifficultyPieData(exam: ExamDetail) {
  const { easy_percentage, medium_percentage, hard_percentage } = exam;
  const total = easy_percentage + medium_percentage + hard_percentage;
  if (total === 0) return null;
  return [
    { id: 'Easy', label: 'Easy', value: easy_percentage },
    { id: 'Medium', label: 'Medium', value: medium_percentage },
    { id: 'Hard', label: 'Hard', value: hard_percentage },
  ].filter((d) => d.value > 0);
}

export const SimplifiedAnalytics: React.FC<{ exam: ExamDetail }> = ({
  exam,
}) => {
  const analytics: any = exam.analytics || {};
  const mainScore = getMainScore(analytics);
  const pieData = getDifficultyPieData(exam);
  const showDifficulty =
    exam.easy_percentage + exam.medium_percentage + exam.hard_percentage > 0;

  return (
    <div className="space-y-4">
      {/* Main Score Radial Chart */}
      <div className="flex justify-center">
        <div className="relative">
          <NivoRadialProgress value={mainScore.value} label={''} height={120} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {mainScore.value}%
              </div>
              <div className="text-xs text-gray-500">Integrity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Pie Chart */}
      {showDifficulty && pieData && (
        <div className="flex justify-center">
          <div className="w-32 h-32">
            <NivoPieChart data={pieData} height={120} legend={false} />
          </div>
        </div>
      )}
    </div>
  );
};
