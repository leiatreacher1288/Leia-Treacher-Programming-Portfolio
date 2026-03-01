export const useMandatoryQuestions = () => {
  const questions = [
    {
      id: 1,
      text: 'A comprehensive explanation of Einstein’s theory of special and general relativity.',
      difficulty: 'Hard',
      subject: 'Physics',
    },
    {
      id: 2,
      text: 'Detailed description of the biochemical process by which green plants use sunlight, water, and carbon dioxide.',
      difficulty: 'Medium',
      subject: 'Biology',
    },
    {
      id: 3,
      text: 'A detailed question about the capital city of France, including historical context and significance.',
      difficulty: 'Easy',
      subject: 'Geography',
    },
    {
      id: 4,
      text: 'A basic algebraic equation requiring the user to find the value of x.',
      difficulty: 'Hard',
      subject: 'Algebra',
    },
    {
      id: 5,
      text: 'Question asking to list the primary colors in additive and subtractive color models.',
      difficulty: 'Easy',
      subject: 'Art',
    },
  ];

  return { questions, isLoading: false };
};
