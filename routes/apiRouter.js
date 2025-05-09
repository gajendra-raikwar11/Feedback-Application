const express = require("express");
const router = express.Router();
const {
  craftEnhancedPrompts,
  parseAndStructureResponse,
} = require("../shared/promptUtils");

router.post("/feedback-questions", async (req, res) => {
  try {
    const requestData = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Create the prompt
    const prompt = craftEnhancedPrompts(requestData.topic, {
      audience: requestData.audience,
      numQuestions: requestData.numQuestions,
      questionDepth: requestData.questionDepth,
      goal: requestData.goal,
      questionType: requestData.questionType,
      mcqOptions: requestData.mcqOptions,
    });

    // Call Gemini API with retries
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${requestData.model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500,
                topP: 0.95,
                topK: 40,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 503) {
            attempts++;
            if (attempts < maxAttempts) {
              // Wait before retrying (exponential backoff)
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, attempts) * 1000)
              );
              continue;
            }
          }
          throw new Error(`API Error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const rawContent = data.candidates[0].content.parts[0].text;
        const structuredQuestions = parseAndStructureResponse(
          rawContent,
          requestData.numQuestions
        );

        return res.json(structuredQuestions);
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          throw error;
        }
        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempts) * 1000)
        );
      }
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: true,
      message: error.message,
      retryAfter: 30, // Suggest retry after 30 seconds
    });
  }
});

module.exports = router;
