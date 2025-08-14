/**
 * Utility functions for handling score calculations
 */

/**
 * Updates subject scores based on user answers
 * @param questions - Array of questions
 * @param userAnswers - Array of user answers
 * @param currentSubjectScores - Current subject scores object
 * @returns Updated subject scores object
 */
export const updateSubjectScores = (
  questions: any[],
  userAnswers: string[],
  currentSubjectScores: { [key: string]: number }
): { [key: string]: number } => {
  // Create a copy of the current subject scores to avoid mutation
  const updatedScores = { ...currentSubjectScores };
  
  // Initialize any missing subjects with 0
  questions.forEach(question => {
    if (question.subject && !(question.subject in updatedScores)) {
      updatedScores[question.subject] = 0;
    }
  });
  
  // Reset all scores to 0 before recounting
  Object.keys(updatedScores).forEach(subject => {
    if (subject !== 'subCategory') { // Preserve subCategory if it exists
      updatedScores[subject] = 0;
    }
  });
  
  // Count correct answers by subject
  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const correctAnswer = question.correctAnswer;
    const subject = question.subject || 'General';
    
    // Check if answer is correct and increment the corresponding subject score
    if (userAnswer && userAnswer === correctAnswer) {
      // Make sure the subject exists in our scores object
      if (!(subject in updatedScores)) {
        updatedScores[subject] = 0;
      }
      
      // Increment the score for this subject
      updatedScores[subject] += 1;
      
      console.log(`Correct answer for subject ${subject}, new score: ${updatedScores[subject]}`);
    }
  });
  
  return updatedScores;
};

/**
 * Logs subject scores for debugging
 * @param scores - Subject scores object
 */
export const logSubjectScores = (scores: { [key: string]: any }) => {
  console.log("Subject scores breakdown:");
  Object.entries(scores).forEach(([subject, score]) => {
    if (subject !== 'subCategory') {
      console.log(`- ${subject}: ${score}`);
    }
  });
};