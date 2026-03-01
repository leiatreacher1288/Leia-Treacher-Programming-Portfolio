import React, { useMemo } from 'react';
import clsx from 'clsx';
import { OverviewSummaryCard } from '../cards/OverviewSummaryCard';
import { StandardButton } from '../ui/StandardButton';
import { DifficultyBarDisplay } from './DifficultyBarDisplay';
import { Tooltip } from '../ui/Tooltip';
import { Power, Info } from 'lucide-react';

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;

type Question = { difficulty?: string | number; id: string };

type DifficultyCardProps = {
  selectedMode: 'auto' | 'even' | null;
  setSelectedMode: (mode: 'auto' | 'even' | null) => void;
  savedDistribution: {
    Easy: number;
    Medium: number;
    Hard: number;
    Unknown: number;
  };
  setEnabled: (v: boolean) => void;
  onSave: (
    mode: 'auto' | 'even',
    distribution: {
      Easy: number;
      Medium: number;
      Hard: number;
      Unknown: number;
    }
  ) => void;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  questions: Question[];
  questionsPerVariant: number;
  numVariants: number;
  allowReuse: boolean;
  enabled?: boolean;
  hideSaveButton?: boolean; // New prop to hide save button in wizard
  mandatoryQuestions?: Question[];
};

const ALL_LEVELS = ['Easy', 'Medium', 'Hard', 'Unknown'] as const;

function canEvenSplit({
  available,
  numVariants,
  questionsPerVariant,
  allowReuse,
}: any) {
  const needed = allowReuse
    ? questionsPerVariant
    : (numVariants * questionsPerVariant) / DIFFICULTY_LEVELS.length;
  return DIFFICULTY_LEVELS.every(
    (level) => available[level] >= Math.ceil(needed)
  );
}

function canAutoBalance({
  available,
  numVariants,
  questionsPerVariant,
  allowReuse,
}: any) {
  const totalNeeded = allowReuse
    ? questionsPerVariant
    : numVariants * questionsPerVariant;
  const totalAvailable = ALL_LEVELS.reduce(
    (sum, level) => sum + available[level],
    0
  );
  return totalAvailable >= totalNeeded;
}

// 1. Remove warning text under Even Split button
// 2. Center both buttons with a good gap between them
// 3. Update auto-balance logic for unique mode

// --- Updated logic for unique mode fairness ---
function canDistributeFairly({
  available,
  numVariants,
  questionsPerVariant,
  allowReuse,
}: any) {
  if (allowReuse)
    return canAutoBalance({
      available,
      numVariants,
      questionsPerVariant,
      allowReuse,
    });
  // Unique mode: partition the pool into numVariants groups of questionsPerVariant, each with the same distribution
  const totalNeeded = numVariants * questionsPerVariant;
  const totalAvailable = ALL_LEVELS.reduce(
    (sum, level) => sum + available[level],
    0
  );
  if (totalAvailable < totalNeeded) return false;
  // Build a flat array of all difficulties
  const pool: string[] = [];
  for (const level of ALL_LEVELS) {
    for (let i = 0; i < available[level]; i++) pool.push(level);
  }
  // Helper: count distribution of a group
  function getDist(group: string[]) {
    return ALL_LEVELS.map((l) => group.filter((x) => x === l).length).join(',');
  }
  // Recursive backtracking: try to partition pool into N groups of size K, all with the same distribution
  function canPartition(groups: string[][], remaining: string[]): boolean {
    if (groups.length === numVariants) {
      // All groups filled, check if all have the same distribution
      const dists = groups.map(getDist);
      return dists.every((d) => d === dists[0]);
    }
    // Try all combinations for the next group
    const used = new Set<string>();
    function* combinations(
      arr: string[],
      k: number,
      start = 0,
      curr: string[] = []
    ): Generator<string[]> {
      if (curr.length === k) {
        yield curr;
        return;
      }
      for (let i = start; i < arr.length; i++) {
        // Skip duplicates at the same recursion level
        if (i > start && arr[i] === arr[i - 1]) continue;
        yield* combinations(
          arr.slice(0, i).concat(arr.slice(i + 1)),
          k,
          i,
          curr.concat(arr[i])
        );
      }
    }
    // Sort to help skip duplicates
    const sorted = [...remaining].sort();
    for (const group of combinations(sorted, questionsPerVariant)) {
      const dist = getDist(group);
      if (used.has(dist)) continue; // Only try one group per unique distribution
      used.add(dist);
      // Remove group from remaining
      const rem = [...remaining];
      for (const q of group) {
        const idx = rem.indexOf(q);
        if (idx !== -1) rem.splice(idx, 1);
      }
      if (canPartition([...groups, group], rem)) return true;
    }
    return false;
  }
  return canPartition([], pool);
}

export const DifficultyCard = ({
  selectedMode,
  setSelectedMode,
  savedDistribution,
  setEnabled,
  onSave,
  isSaving,
  saveStatus,
  questions,
  questionsPerVariant,
  numVariants,
  allowReuse,
  enabled = true,
  hideSaveButton = false,
  mandatoryQuestions = [],
}: DifficultyCardProps) => {
  // error state removed
  const safeQuestions = useMemo(() => questions ?? [], [questions]);
  // Exclude mandatory questions from the pool for distribution
  const mandatoryIds = useMemo(
    () => new Set((mandatoryQuestions ?? []).map((q) => q.id)),
    [mandatoryQuestions]
  );
  const availableByDifficulty = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    let unknown = 0;
    for (const q of safeQuestions) {
      if (mandatoryIds.has(q.id)) continue;
      let d = (q as any).question?.difficulty ?? (q as any).difficulty;
      if (typeof d === 'string') d = d.trim().toLowerCase();
      if (d === 'easy' || d === 1 || d === '1') easy++;
      else if (d === 'medium' || d === 2 || d === '2') medium++;
      else if (d === 'hard' || d === 3 || d === '3') hard++;
      else unknown++;
    }
    return { Easy: easy, Medium: medium, Hard: hard, Unknown: unknown };
  }, [safeQuestions, mandatoryIds]);

  const evenSplitPossible = canEvenSplit({
    available: availableByDifficulty,
    numVariants,
    questionsPerVariant,
    allowReuse,
  });
  const autoBalancePossible = canAutoBalance({
    available: availableByDifficulty,
    numVariants,
    questionsPerVariant,
    allowReuse,
  });

  const fairSplitPossible = useMemo(
    () =>
      canDistributeFairly({
        available: availableByDifficulty,
        numVariants,
        questionsPerVariant,
        allowReuse,
      }),
    [availableByDifficulty, numVariants, questionsPerVariant, allowReuse]
  );

  const evenSplit = useMemo(() => {
    const base = Math.floor(100 / 3);
    const remainder = 100 - base * 3;
    const easy = base + (remainder > 0 ? 1 : 0);
    const medium = base + (remainder > 1 ? 1 : 0);
    const hard = base;
    const unknown = 100 - (easy + medium + hard);
    return {
      Easy: easy,
      Medium: medium,
      Hard: hard,
      Unknown: unknown,
    };
  }, []);

  const autoBalance = useMemo(() => {
    const total =
      availableByDifficulty.Easy +
      availableByDifficulty.Medium +
      availableByDifficulty.Hard +
      availableByDifficulty.Unknown;

    if (total === 0) {
      return { Easy: 0, Medium: 0, Hard: 0, Unknown: 0 };
    }

    // Simple percentage calculation based on available questions
    const result = {
      Easy: Math.round((availableByDifficulty.Easy / total) * 100),
      Medium: Math.round((availableByDifficulty.Medium / total) * 100),
      Hard: Math.round((availableByDifficulty.Hard / total) * 100),
      Unknown: Math.round((availableByDifficulty.Unknown / total) * 100),
    };

    // Ensure total is exactly 100%
    const sum = result.Easy + result.Medium + result.Hard + result.Unknown;
    const remainder = 100 - sum;

    if (remainder !== 0) {
      // Add remainder to the largest category
      const maxCategory = Object.entries(result).reduce((a, b) =>
        result[a[0] as keyof typeof result] >
        result[b[0] as keyof typeof result]
          ? a
          : b
      )[0] as keyof typeof result;
      result[maxCategory] += remainder;
    }

    return result;
  }, [availableByDifficulty]);

  const displayedDistribution =
    selectedMode === 'even' ? evenSplit : autoBalance;

  const sumDistribution =
    displayedDistribution.Easy +
    displayedDistribution.Medium +
    displayedDistribution.Hard +
    displayedDistribution.Unknown;
  const showOverlay =
    (!fairSplitPossible && enabled) || sumDistribution !== 100;

  const isSaved =
    !!selectedMode &&
    ((selectedMode === 'even' &&
      savedDistribution.Easy === evenSplit.Easy &&
      savedDistribution.Medium === evenSplit.Medium &&
      savedDistribution.Hard === evenSplit.Hard &&
      savedDistribution.Unknown === evenSplit.Unknown) ||
      (selectedMode === 'auto' &&
        savedDistribution.Easy === autoBalance.Easy &&
        savedDistribution.Medium === autoBalance.Medium &&
        savedDistribution.Hard === autoBalance.Hard &&
        savedDistribution.Unknown === autoBalance.Unknown));

  // Patch: always set unknown to 100 - (easy + medium + hard), never block save
  function handleSaveWithSumCheck(mode: 'auto' | 'even', distribution: any) {
    const easy = distribution.Easy || 0;
    const medium = distribution.Medium || 0;
    const hard = distribution.Hard || 0;
    let unknown = 100 - (easy + medium + hard);
    if (unknown < 0) unknown = 0;
    onSave(mode, { Easy: easy, Medium: medium, Hard: hard, Unknown: unknown });
  }

  return (
    <OverviewSummaryCard
      accent="blue"
      className="relative !border-[1.5px] !rounded-lg h-full"
    >
      {/* Manual disable toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-lg">Difficulty Distribution</span>
        <button
          type="button"
          className={clsx(
            'flex items-center gap-2 px-3 py-1 rounded transition',
            enabled
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-600 border border-gray-300',
            'text-sm font-medium shadow'
          )}
          onClick={() => setEnabled(!enabled)}
        >
          <Power size={16} />
          {enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Overlay for not enough questions */}
      {showOverlay && enabled && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center px-6 text-center space-y-2 pointer-events-auto">
          <Info className="w-6 h-6 text-gray-400" />
          <p className="text-base font-medium text-gray-800">
            Difficulty distribution unavailable
          </p>
          <p className="text-sm text-gray-600 max-w-xs">
            You need more questions tagged as
            <span className="font-medium text-green-600"> Easy</span>,
            <span className="font-medium text-yellow-600"> Medium</span>, or
            <span className="font-medium text-red-500"> Hard </span>
            to use this feature.
          </p>
        </div>
      )}

      <div
        className={clsx(
          enabled ? '' : 'pointer-events-none opacity-50',
          showOverlay ? 'pointer-events-none opacity-40' : ''
        )}
      >
        {/* Buttons and warning */}
        <div className="flex flex-col items-center gap-2 mb-4 z-20 relative">
          <div className="flex justify-center gap-8 w-full">
            <Tooltip>
              <span className="flex flex-col items-center">
                <button
                  type="button"
                  className={clsx(
                    'px-4 py-2 rounded text-sm font-semibold shadow transition min-w-[120px]',
                    selectedMode === 'even'
                      ? 'bg-primary-btn text-white'
                      : evenSplitPossible && !showOverlay
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-40'
                  )}
                  onClick={() =>
                    evenSplitPossible && !showOverlay && setSelectedMode('even')
                  }
                  disabled={!evenSplitPossible || showOverlay}
                >
                  Even Split
                </button>
              </span>
            </Tooltip>
            <Tooltip>
              <span>
                <button
                  type="button"
                  className={clsx(
                    'px-4 py-2 rounded text-sm font-semibold shadow transition min-w-[120px]',
                    selectedMode === 'auto'
                      ? 'bg-primary-btn text-white'
                      : autoBalancePossible && !showOverlay
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-40'
                  )}
                  onClick={() =>
                    autoBalancePossible &&
                    !showOverlay &&
                    setSelectedMode('auto')
                  }
                  disabled={!autoBalancePossible || showOverlay}
                >
                  Auto Balance
                </button>
              </span>
            </Tooltip>
          </div>
        </div>
        <div className="my-6">
          <DifficultyBarDisplay percentages={displayedDistribution} />
        </div>

        {/* Explainer Info Card */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="text-blue-600" size={10} />
            </div>
            <div className="flex-1 text-xs text-blue-800 space-y-1">
              <div>
                <span className="font-medium">Even Split:</span> Attempts to
                provide an equal distribution (33% each).
              </div>
              <div>
                <span className="font-medium">Auto Balance:</span> Adapts to
                your question pool distribution.
              </div>
            </div>
          </div>
        </div>

        {!hideSaveButton && (
          <div className="flex justify-end mt-6">
            <StandardButton
              onClick={() => {
                if (!selectedMode) return;
                handleSaveWithSumCheck(selectedMode, displayedDistribution);
              }}
              disabled={
                isSaving ||
                saveStatus === 'saving' ||
                !selectedMode ||
                showOverlay ||
                isSaved ||
                !enabled
              }
            >
              {saveStatus === 'saving'
                ? 'Saving...'
                : isSaved
                  ? 'All Changes Saved'
                  : !selectedMode
                    ? 'Select a mode'
                    : 'Save Changes'}
            </StandardButton>
          </div>
        )}
      </div>
    </OverviewSummaryCard>
  );
};
