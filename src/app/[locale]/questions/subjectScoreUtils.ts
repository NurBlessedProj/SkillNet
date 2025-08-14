/**
 * Utility functions for handling subject scores in the assessment
 */

// Updates subject scores based on correct answers
export const updateSubjectScores = (
  questions: any[],
  userAnswers: string[],
  currentSubjectScores: { [key: string]: number }
) => {
  // Create a copy of the current scores to avoid direct state mutation
  const updatedScores = { ...currentSubjectScores };
  
  // Reset all subject scores to 0 first to ensure accurate counting
  Object.keys(updatedScores).forEach(subject => {
    // Skip non-numeric properties like subCategory
    if (subject !== 'subCategory' && subject !== 'terminated' && subject !== 'terminationReason') {
      updatedScores[subject] = 0;
    }
  });
  
  // Count correct answers by subject
  userAnswers.forEach((answer, index) => {
    const question = questions[index];
    if (question && answer === question.correctAnswer) {
      const subject = question.subject;
      if (subject) {
        // Initialize the subject if it doesn't exist
        if (updatedScores[subject] === undefined) {
          updatedScores[subject] = 0;
        }
        // Increment the score for this subject
        updatedScores[subject] = (updatedScores[subject] || 0) + 1;
      }
    }
  });
  
  return updatedScores;
};

// Logs subject scores for debugging
export const logSubjectScores = (scores: { [key: string]: any }) => {
  console.log("Subject Scores:");
  Object.entries(scores).forEach(([subject, score]) => {
    if (subject !== 'subCategory' && subject !== 'terminated' && subject !== 'terminationReason') {
      console.log(`  ${subject}: ${score}`);
    }
  });
};