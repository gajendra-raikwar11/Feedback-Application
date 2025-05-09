// Gemini Integration Logic
document.addEventListener("DOMContentLoaded", function () {
  // Constants and API Configuration
  const GEMINI_API_KEY = "AIzaSyDZFSQtnE_xaP0Y22dCtAhEcM-KK46Np0M"; // Replace with your actual API key

  // Elements
  const feedbackTopicInput = document.getElementById("feedbackTopic");
  const audienceInput = document.getElementById("audience");
  const numQuestionsSelect = document.getElementById("numQuestions");
  const questionTypeSelect = document.getElementById("questionType");
  const questionDepthSelect = document.getElementById("questionDepth");
  const mcqOptionsContainer = document.getElementById("mcqOptionsContainer");
  const mcqOptionsSelect = document.getElementById("mcqOptions");
  const goalTextarea = document.getElementById("goal");
  const modelSelect = document.getElementById("model");
  const generateQuestionsBtn = document.getElementById("generateQuestions");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const errorContainer = document.getElementById("errorContainer");
  const errorMessage = document.getElementById("errorMessage");
  const resultsContainer = document.getElementById("resultsContainer");
  const questionsContainer = document.getElementById("questionsContainer");
  const useAllQuestionsBtn = document.getElementById("useAllQuestions");
  const generateMoreQuestionsBtn = document.getElementById(
    "generateMoreQuestions"
  );

  // At the top of the file, after your imports
  const { craftEnhancedPrompts, parseAndStructureResponse } =
    window.promptUtils;

  // Show/hide MCQ options based on question type
  questionTypeSelect.addEventListener("change", function () {
    if (this.value === "multiple-choice" || this.value === "mixed") {
      mcqOptionsContainer.classList.remove("hidden");
    } else {
      mcqOptionsContainer.classList.add("hidden");
    }
  });

  // Generate questions
  generateQuestionsBtn.addEventListener("click", function () {
    // Validate input
    if (!feedbackTopicInput.value.trim()) {
      errorContainer.classList.remove("hidden");
      errorMessage.textContent = "Please enter a topic for feedback questions";
      return;
    }

    // Show loading indicator
    loadingIndicator.classList.remove("hidden");
    errorContainer.classList.add("hidden");
    resultsContainer.classList.add("hidden");

    // Prepare data for API call
    const requestData = {
      topic: feedbackTopicInput.value.trim(),
      audience: audienceInput.value.trim() || "relevant stakeholders",
      numQuestions: parseInt(numQuestionsSelect.value) || 5,
      questionDepth: questionDepthSelect.value || "moderate",
      goal:
        goalTextarea.value.trim() ||
        "gather actionable insights and identify improvement areas",
      questionType: questionTypeSelect.value || "open-ended",
      mcqOptions: mcqOptionsSelect.value || "4",
      model: modelSelect.value || "gemini-1.5-pro",
    };

    // Call the Gemini API directly from client-side
    generateFeedbackQuestionsWithGemini(requestData)
      .then((result) => {
        // Hide loading indicator
        loadingIndicator.classList.add("hidden");

        // Display results
        displayResults(result);
      })
      .catch((error) => {
        // Hide loading indicator
        loadingIndicator.classList.add("hidden");

        // Show error with retry button if it's a 503
        errorContainer.classList.remove("hidden");
        if (
          error.message.includes("503") ||
          error.message.includes("unavailable")
        ) {
          errorMessage.innerHTML = `
                ${error.message}
                <button class="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" onclick="retryGeneration()">
                    Retry
                </button>
            `;
        } else {
          errorMessage.textContent =
            error.message || "Failed to generate feedback questions";
        }
        console.error("Error generating questions:", error);
      });
  });

  // Generate more questions
  generateMoreQuestionsBtn.addEventListener("click", function () {
    generateQuestionsBtn.click();
  });

  // Use all questions - this integrates with your existing template functionality
  useAllQuestionsBtn.addEventListener("click", function () {
    const questions = Array.from(
      document.querySelectorAll(".question-item")
    ).map((item) => item.querySelector(".question-text").textContent);

    // Get the template builder's content area - assume it exists in your template-builder.ejs
    // Adjust the selector based on your actual template structure
    const templateContentArea =
      document.querySelector("#template-content") ||
      document.querySelector(".template-content-area") ||
      document.querySelector("[data-template-content]");

    if (templateContentArea) {
      // Add the questions to the template content area
      const questionsHtml = questions
        .map((q) => {
          // Create a properly formatted question element based on your template structure
          // This is an example - adjust based on your actual template format
          return `<div class="question-block mb-4">
                    <div class="question-text font-medium">${q}</div>
                    <div class="answer-area mt-2 p-2 border border-gray-300 rounded min-h-[60px]"></div>
                  </div>`;
        })
        .join("");

      // Add to template content
      templateContentArea.innerHTML += questionsHtml;

      // You may need to trigger any initialization or update functions
      // that your template builder uses to register new content
      if (typeof updateTemplateContent === "function") {
        updateTemplateContent();
      }

      // Or dispatch an event for other components to handle
      document.dispatchEvent(
        new CustomEvent("templateContentUpdated", {
          detail: { addedQuestions: questions },
        })
      );

      // Close the Gemini section or show a success message
      alert(`${questions.length} questions have been added to your template!`);
    } else {
      console.error("Template content area not found");
      alert(
        "Could not find the template content area. Please add questions manually."
      );
    }
  });

  /**
   * Generate feedback questions using Gemini directly from client-side or server-side
   * @param {Object} requestData - Request parameters
   * @returns {Promise<Object>} - Structured questions
   */
  async function generateFeedbackQuestionsWithGemini(requestData) {
    try {
      // Choose whether to use server-side API or direct client-side API
      const useServerSideApi = true; // Set to false to use direct client-side API instead

      if (useServerSideApi) {
        // Use server-side API route
        const response = await fetch("/api/feedback-questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Response:", errorText);

          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.code === 503) {
              throw new Error(
                "The Gemini API is temporarily unavailable. Please try again in a few minutes."
              );
            }
            throw new Error(`API error: ${JSON.stringify(errorData)}`);
          } catch (e) {
            throw new Error(
              `API error: ${response.statusText} (${response.status})`
            );
          }
        }

        return await response.json();
      } else {
        // Direct client-side API call to Gemini
        // Create enhanced prompt for Gemini
        const prompt = craftEnhancedPrompts(requestData.topic, {
          audience: requestData.audience,
          numQuestions: requestData.numQuestions,
          questionDepth: requestData.questionDepth,
          goal: requestData.goal,
          questionType: requestData.questionType,
          mcqOptions: requestData.mcqOptions,
        });

        // Call Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${requestData.model}:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(geminiUrl, {
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
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Response:", errorText);

          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.code === 503) {
              throw new Error(
                "The Gemini API is temporarily unavailable. Please try again in a few minutes."
              );
            }
            throw new Error(`API error: ${JSON.stringify(errorData)}`);
          } catch (e) {
            throw new Error(
              `API error: ${response.statusText} (${response.status})`
            );
          }
        }

        const data = await response.json();

        // Extract and parse response
        const rawContent = data.candidates[0].content.parts[0].text;
        return parseAndStructureResponse(rawContent, requestData.numQuestions);
      }
    } catch (error) {
      console.error("Error generating feedback questions:", error);
      throw error;
    }
  }

  /**
   * Display results in the UI
   * @param {Object} result - Structured questions
   */
  function displayResults(result) {
    // Clear previous results
    questionsContainer.innerHTML = "";

    // Display each question
    if (result.suggestions && result.suggestions.length > 0) {
      result.suggestions.forEach((item, index) => {
        const questionCard = document.createElement("div");
        questionCard.className =
          "question-item bg-white p-4 md:p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-4";

        let questionHtml = `
          <div class="flex justify-between items-start gap-3">
            <h5 class="font-medium text-gray-900 question-text text-base md:text-lg">${item.question}</h5>
            <button class="text-blue-500 hover:text-blue-700 transition-colors duration-200 use-question-btn flex-shrink-0" data-index="${index}" aria-label="Add question">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        `;

        // Add intent if available
        if (item.intent) {
          questionHtml += `<p class="text-sm text-gray-600 mt-2">${item.intent}</p>`;
        }

        // Add category if available
        if (item.category) {
          questionHtml += `<div class="mt-2 inline-block px-2 py-1 bg-gray-100 text-xs font-medium text-gray-700 rounded-full">${item.category}</div>`;
        }

        // Add options if available (for multiple-choice questions)
        if (item.options && Array.isArray(item.options)) {
          questionHtml += `
            <div class="mt-3 bg-gray-50 p-3 rounded-md">
              <p class="text-sm font-medium text-gray-700 mb-2">Options:</p>
              <ul class="space-y-1 text-sm text-gray-600">
          `;

          item.options.forEach((option) => {
            questionHtml += `<li class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="9" stroke-width="2" />
              </svg>
              ${
                typeof option === "string"
                  ? option
                  : option.text || option.label || JSON.stringify(option)
              }
            </li>`;
          });

          questionHtml += `</ul></div>`;
        }

        // Add scale if available (for Likert-scale questions)
        if (item.scale) {
          questionHtml += `
            <div class="mt-3 bg-gray-50 p-3 rounded-md">
              <p class="text-sm font-medium text-gray-700 mb-2">Scale:</p>
              <div class="flex justify-between text-xs text-gray-600 mt-1">
          `;

          const scaleObj = typeof item.scale === "object" ? item.scale : {};
          const keys = Object.keys(scaleObj).sort();

          if (keys.length > 0) {
            keys.forEach((key) => {
              questionHtml += `<span class="px-2 py-1 bg-white rounded shadow-sm">${key}: ${scaleObj[key]}</span>`;
            });
          } else {
            questionHtml += `
              <span class="px-2 py-1 bg-white rounded shadow-sm">1: Strongly Disagree</span>
              <span class="px-2 py-1 bg-white rounded shadow-sm">5: Strongly Agree</span>
            `;
          }

          questionHtml += `</div></div>`;
        }

        questionCard.innerHTML = questionHtml;
        questionsContainer.appendChild(questionCard);

        // Add event listener to use question button
        const useQuestionBtn = questionCard.querySelector(".use-question-btn");
        if (useQuestionBtn) {
          useQuestionBtn.addEventListener("click", function () {
            const index = this.getAttribute("data-index");
            const question = result.suggestions[index];

            // Get the template builder's content area - assume it exists in your template-builder.ejs
            // Adjust the selector based on your actual template structure
            const templateContentArea =
              document.querySelector("#template-content") ||
              document.querySelector(".template-content-area") ||
              document.querySelector("[data-template-content]");

            if (templateContentArea) {
              // Determine what type of question this is and format appropriately
              let answerAreaHtml = `<div class="answer-area mt-2 p-3 border border-gray-200 rounded-md min-h-[60px] bg-white"></div>`;

              // For multiple choice questions
              if (question.options && Array.isArray(question.options)) {
                const optionsHtml = question.options
                  .map((option, idx) => {
                    const optionText =
                      typeof option === "string"
                        ? option
                        : option.text || option.label || JSON.stringify(option);
                    const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D...

                    return `
                      <div class="flex items-start mt-2">
                        <input type="radio" id="option${idx}" name="q${Date.now()}" class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300">
                        <label for="option${idx}" class="ml-2 text-gray-700">${optionLetter}. ${optionText}</label>
                      </div>
                    `;
                  })
                  .join("");

                answerAreaHtml = `
                  <div class="answer-options mt-3">
                    ${optionsHtml}
                  </div>
                `;
              }

              // For Likert scale questions
              else if (question.scale) {
                const scaleObj =
                  typeof question.scale === "object" ? question.scale : {};
                const keys = Object.keys(scaleObj).sort();

                if (keys.length > 0) {
                  const scaleHtml = keys
                    .map((key) => {
                      return `
                        <div class="text-center">
                          <input type="radio" id="scale${key}" name="q${Date.now()}" class="mb-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300">
                          <div class="text-xs font-medium">${key}</div>
                          <div class="text-xs text-gray-500">${
                            scaleObj[key]
                          }</div>
                        </div>
                      `;
                    })
                    .join("");

                  answerAreaHtml = `
                    <div class="mt-3">
                      <div class="flex justify-between space-x-2 md:space-x-4 p-3 bg-gray-50 rounded-md">
                        ${scaleHtml}
                      </div>
                    </div>
                  `;
                } else {
                  answerAreaHtml = `
                    <div class="mt-3">
                      <div class="flex justify-between items-center space-x-2 md:space-x-4 p-3 bg-gray-50 rounded-md">
                        <div class="flex flex-col items-center">
                          <input type="radio" id="scale1" name="q${Date.now()}" class="mb-1 h-4 w-4 text-blue-600">
                          <label class="text-xs font-medium">1</label>
                          <span class="text-xs text-gray-500">Strongly Disagree</span>
                        </div>
                        <div class="flex flex-col items-center">
                          <input type="radio" id="scale2" name="q${Date.now()}" class="mb-1 h-4 w-4 text-blue-600">
                          <label class="text-xs font-medium">2</label>
                        </div>
                        <div class="flex flex-col items-center">
                          <input type="radio" id="scale3" name="q${Date.now()}" class="mb-1 h-4 w-4 text-blue-600">
                          <label class="text-xs font-medium">3</label>
                        </div>
                        <div class="flex flex-col items-center">
                          <input type="radio" id="scale4" name="q${Date.now()}" class="mb-1 h-4 w-4 text-blue-600">
                          <label class="text-xs font-medium">4</label>
                        </div>
                        <div class="flex flex-col items-center">
                          <input type="radio" id="scale5" name="q${Date.now()}" class="mb-1 h-4 w-4 text-blue-600">
                          <label class="text-xs font-medium">5</label>
                          <span class="text-xs text-gray-500">Strongly Agree</span>
                        </div>
                      </div>
                    </div>
                  `;
                }
              }

              // Add to template content
              templateContentArea.innerHTML += `
                <div class="question-block mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div class="question-text font-medium text-gray-800">${question.question}</div>
                  ${answerAreaHtml}
                </div>
              `;

              // You may need to trigger any initialization or update functions
              if (typeof updateTemplateContent === "function") {
                updateTemplateContent();
              }

              // Or dispatch an event for other components to handle
              document.dispatchEvent(
                new CustomEvent("templateContentUpdated", {
                  detail: { addedQuestion: question },
                })
              );

              // Add a success indicator
              this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              `;
              this.classList.remove("text-blue-500", "hover:text-blue-700");
              this.classList.add("text-green-500");

              // Disable the button to prevent adding the same question multiple times
              this.disabled = true;
            } else {
              console.error("Template content area not found");
              alert(
                "Could not find the template content area. Please add the question manually."
              );
            }
          });
        }
      });

      // Show results container
      resultsContainer.classList.remove("hidden");
    } else {
      // No results
      errorContainer.classList.remove("hidden");
      errorMessage.textContent =
        "No questions were generated. Please try again.";
    }
  }
});
