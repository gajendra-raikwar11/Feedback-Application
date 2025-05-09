/**
 * Create enhanced prompts for Gemini
 * @param {string} topic - Main topic for feedback questions
 * @param {Object} options - Configuration options
 * @returns {string} - Structured prompt for Gemini
 */
function craftEnhancedPrompts(topic, options = {}) {
  const config = {
    numQuestions: options.numQuestions || 5,
    audience: options.audience || "relevant stakeholders",
    questionDepth: options.questionDepth || "moderate",
    goal: options.goal || "gather actionable insights",
    questionType: options.questionType || "open-ended",
    mcqOptions: options.mcqOptions || "4",
  };

  return `You are an expert feedback question designer.
Topic: ${topic}
Audience: ${config.audience}
Goal: ${config.goal}
Format: ${config.questionType}
Number of Questions: ${config.numQuestions}
Depth: ${config.questionDepth}

Please generate ${config.numQuestions} well-structured feedback questions.
Return response in JSON format with an array of question objects.`;
}

/**
 * Parse and structure the Gemini response
 * @param {string} content - Raw content from Gemini response
 * @param {number} requestedCount - Number of questions requested
 * @returns {object} - Structured array of questions
 */
function parseAndStructureResponse(content, requestedCount) {
  try {
    // Extract JSON if there are text markers around it
    let jsonContent = content;
    const jsonMatch =
      content.match(/```json\n([\s\S]*?)\n```/) ||
      content.match(/```\n([\s\S]*?)\n```/) ||
      content.match(/\{[\s\S]*\}/) ||
      content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      jsonContent = jsonMatch[0].replace(/```json\n|```\n|```/g, "");
    }

    // Parse the content
    const parsedContent = JSON.parse(jsonContent);

    // If it's an array, return it wrapped
    if (Array.isArray(parsedContent)) {
      return { suggestions: parsedContent };
    }

    // If it has a questions property as an array
    if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
      return { suggestions: parsedContent.questions };
    }

    // Otherwise return the whole parsed content
    return { suggestions: parsedContent };
  } catch (e) {
    console.error("Error parsing JSON:", e);

    // Not valid JSON, try to parse as text
    const numberedQuestionsRegex = /\d+\.\s+(.+?)(?=\n\d+\.|\n\n|$)/gs;
    const numberedMatches = [...content.matchAll(numberedQuestionsRegex)];

    if (numberedMatches.length >= requestedCount) {
      return {
        suggestions: numberedMatches.map((match) => ({
          question: match[1].trim(),
          intent: "To gather feedback on this specific aspect",
        })),
      };
    }

    // Fall back to splitting by newlines
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 &&
          !line.startsWith("#") &&
          !line.match(/^Question \d+:/i)
      );

    return {
      suggestions: lines.map((line) => ({
        question: line.replace(/^\d+\.\s*/, ""),
        intent: "To gather specific feedback",
      })),
    };
  }
}

// Export for both Node.js and browser environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { craftEnhancedPrompts, parseAndStructureResponse };
} else {
  window.promptUtils = { craftEnhancedPrompts, parseAndStructureResponse };
}
