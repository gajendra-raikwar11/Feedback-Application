const mongoose = require("mongoose");
const Joi = require("joi");

// Constants for mapping response texts to numeric values
const RESPONSE_MAPS = {
  rating: {
    "Poor": 1,
    "Average": 2,
    "Good": 3,
    "Excellent": 5,
    "No Opinion": null
  },
  yes_no: {
    "No": 1,
    "Yes": 5,
    "No Opinion": null
  },
  weight: {
    "Just right": 3,
    "Too light": 1,
    "Too Heavy": 5,
    "No Opinion": null
  },
  satisfaction: {
    "Very Good": 5,
    "Good": 4,
    "Fair": 3,
    "Satisfactory": 2,
    "Unsatisfied": 1,
    "No Opinion": null
  },
  agreement: {
    "Strongly Agree": 5,
    "Agree": 4,
    "Neutral": 3,
    "Disagree": 2,
    "Strongly Disagree": 1,
    "No Opinion": null
  },
  frequency: {
    "Always": 5,
    "Frequently": 4,
    "Sometimes": 3,
    "Rarely": 2,
    "Never": 1,
    "No Opinion": null
  }
};

// Reverse maps for converting numeric values back to text
const REVERSE_MAPS = {
  rating: ["Poor", "Average", "Good", "Very Good", "Excellent"],
  yes_no: {1: "No", 5: "Yes"},
  agreement: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
  satisfaction: ["Unsatisfied", "Satisfactory", "Fair", "Good", "Very Good"]
};

// Schema for Feedback Response
const feedbackResponseSchema = new mongoose.Schema({
  formID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeedbackForm",
    required: true
  },
  formTitle: {
    type: String,
    required: true,
    trim: true
  },
  formType: {
    type: String,
    required: true,
    enum: ["Academic", "Institutional", "Training"]
  },
  // Session fields from FeedbackForm schema
  session: {
    type: String,
    required: true,
    trim: true // e.g., "2024-25" or "2024 (Jan - June)"
  },
  semesterType: {
    type: String,
    required: true,
    enum: ["Odd", "Even"]
  },
  sessionLabel: {
    type: String,
    trim: true // e.g., "2024-25 Jan-June"
  },
  // Academic type if applicable
  academicType: {
    type: String,
    enum: ["Theory", "Practical"],
    default: null
  },
  studentID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  facultyID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    default: null
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    trim: true,
    default: null
  },
  commonSemester: {
    type: String,
    trim: true,
    default: null
  },
  commonSection: {
    type: String,
    trim: true,
    default: null
  },
  answers: [
    {
      questionID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
      },
      questionText: {
        type: String,
        required: true,
        trim: true
      },
      sectionTitle: {
        type: String,
        required: true,
        trim: true
      },
      questionType: {
        type: String,
        enum: ["rating", "yes_no", "mcq", "text", "grid", "dropdown", "date", "radio"],
        required: true
      },
      responseText: { type: String, trim: true, default: null },
      responseOptions: [{ type: String }],
      responseRating: { type: Number, min: 0, max: 5, default: null },
      responseDate: { type: Date, default: null },
      responseNumericValue: { type: Number, default: null },
      responseOriginalText: { type: String, trim: true, default: null }
    }
  ],
  // Store average scores for each section
  sectionAverages: [{
    sectionTitle: { type: String, required: true },
    averageScore: { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 },
    countedQuestions: { type: Number, default: 0 }
  }],
  // Overall average score for the entire feedback
  overallAverage: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  countedQuestions: { type: Number, default: 0 },
  status: { type: String, default: "submitted", enum: ["submitted", "pending"] },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Convert text responses to numeric values
feedbackResponseSchema.methods.convertResponseToNumeric = function(responseText, questionType) {
  // Skip processing if response is empty
  if (!responseText && responseText !== 0) {
    return null;
  }
  
  // If responseText is already a number, return it directly
  if (!isNaN(responseText) && responseText !== '') {
    return Number(responseText);
  }
  
  // Try to find a match in any of the response maps
  for (const mapKey in RESPONSE_MAPS) {
    if (RESPONSE_MAPS[mapKey][responseText] !== undefined) {
      return RESPONSE_MAPS[mapKey][responseText];
    }
  }
  
  // Handle grid response format
  if (questionType === "grid") {
    try {
      // Check if responseText is a string that might be JSON
      if (typeof responseText === 'string' && (responseText.startsWith('{') || responseText.startsWith('['))) {
        const parsedValue = JSON.parse(responseText);
        
        // If parsed as a string, try direct mapping
        if (typeof parsedValue === 'string') {
          for (const mapKey in RESPONSE_MAPS) {
            if (RESPONSE_MAPS[mapKey][parsedValue] !== undefined) {
              return RESPONSE_MAPS[mapKey][parsedValue];
            }
          }
          return null;
        }
        
        // If it's an object with row-column values
        if (typeof parsedValue === 'object' && !Array.isArray(parsedValue)) {
          const values = Object.values(parsedValue);
          
          // Extract numeric values when possible
          const numericValues = values.map(val => {
            for (const mapKey in RESPONSE_MAPS) {
              if (RESPONSE_MAPS[mapKey][val] !== undefined) {
                return RESPONSE_MAPS[mapKey][val];
              }
            }
            return Number(val) || null;
          }).filter(v => v !== null);
          
          if (numericValues.length > 0) {
            return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
          }
        }
      }
    } catch (e) {
      console.error("Error parsing grid data:", e);
    }
  }
  
  // If no match found but looks like a number, try parsing it
  if (typeof responseText === 'string' && /^\d+(\.\d+)?$/.test(responseText)) {
    return Number(responseText);
  }
  
  return null;
};

// Get text representation from numeric value based on question type
feedbackResponseSchema.methods.getTextFromNumericValue = function(value, questionType) {
  if (value === null || value === undefined) return "No Opinion";
  
  // Check if it's a valid index-based scale
  if (value >= 1 && value <= 5) {
    switch (questionType) {
      case "rating":
        return REVERSE_MAPS.rating[value-1] || value.toString();
      case "yes_no":
        return REVERSE_MAPS.yes_no[value] || value.toString();
      case "mcq":
      case "radio":
      case "dropdown":
        // Try to find the best match from all reverse maps
        for (const mapKey in REVERSE_MAPS) {
          if (Array.isArray(REVERSE_MAPS[mapKey]) && value <= REVERSE_MAPS[mapKey].length) {
            return REVERSE_MAPS[mapKey][value-1];
          } else if (REVERSE_MAPS[mapKey][value] !== undefined) {
            return REVERSE_MAPS[mapKey][value];
          }
        }
        return value.toString();
      default:
        return value.toString();
    }
  }
  
  return value.toString();
};

// Calculate averages for sections and overall
feedbackResponseSchema.methods.calculateAverages = function() {
  const sectionMap = {};
  let totalScore = 0;
  let totalQuestions = 0;
  let countedQuestions = 0;
  
  // Group answers by section and calculate section averages
  this.answers.forEach(answer => {
    // Skip text-based questions
    if (answer.questionType === "text" || answer.questionType === "date") {
      return;
    }
    
    // Initialize section if it doesn't exist
    if (!sectionMap[answer.sectionTitle]) {
      sectionMap[answer.sectionTitle] = {
        totalScore: 0,
        count: 0,
        countedQuestions: 0,
        questions: []
      };
    }
    
    // Count all questions of rateable types for total questions per section
    sectionMap[answer.sectionTitle].count++;
    totalQuestions++;
    
    // Skip answers with null values (No Opinion)
    if (answer.responseNumericValue === null || answer.responseNumericValue === undefined) {
      return;
    }
    
    // Add to section totals only for valid numeric responses
    sectionMap[answer.sectionTitle].totalScore += answer.responseNumericValue;
    sectionMap[answer.sectionTitle].countedQuestions++;
    sectionMap[answer.sectionTitle].questions.push({
      id: answer.questionID,
      value: answer.responseNumericValue
    });
    
    // Add to overall totals
    totalScore += answer.responseNumericValue;
    countedQuestions++;
  });
  
  // Calculate section averages
  this.sectionAverages = Object.keys(sectionMap).map(section => {
    const sectionData = sectionMap[section];
    const avg = sectionData.countedQuestions > 0 ? 
      sectionData.totalScore / sectionData.countedQuestions : 0;
      
    return {
      sectionTitle: section,
      averageScore: parseFloat(avg.toFixed(2)),
      questionCount: sectionData.count,
      countedQuestions: sectionData.countedQuestions
    };
  });
  
  // Calculate overall average
  this.overallAverage = countedQuestions > 0 ? 
    parseFloat((totalScore / countedQuestions).toFixed(2)) : 0;
  
  // Store total questions and counted questions for reference
  this.totalQuestions = totalQuestions;
  this.countedQuestions = countedQuestions;
  
  return this;
};

// Determine the current academic session
feedbackResponseSchema.methods.determineCurrentSession = function() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
  const currentYear = currentDate.getFullYear();
  
  if (currentMonth >= 0 && currentMonth <= 5) {
    return `${currentYear} (Jan - June)`;
  } else if (currentMonth >= 8 && currentMonth <= 11) {
    return `${currentYear} (Sep - Dec)`;
  } else {
    return `${currentYear} (Jul - Aug)`;
  }
};

// Middleware to process responses before saving
feedbackResponseSchema.pre('save', function(next) {
  // Set session if not already provided
  if (!this.session) {
    this.session = this.determineCurrentSession();
  }
  
  // Set session label if not provided
  if (!this.sessionLabel) {
    const year = this.session.split(' ')[0];
    const period = this.semesterType === "Odd" ? "Jul-Dec" : "Jan-Jun";
    this.sessionLabel = `${year} ${period}`;
  }
  
  // Process each answer
  this.answers.forEach(answer => {
    // Store original response text
    this.storeOriginalResponseText(answer);
    
    // Convert to numeric value based on question type
    this.processAnswerByType(answer);
  });
  
  // Calculate averages
  this.calculateAverages();
  
  next();
});

// Helper method to store original response text
feedbackResponseSchema.methods.storeOriginalResponseText = function(answer) {
  if (answer.responseText) {
    answer.responseOriginalText = answer.responseText;
  } else if (answer.responseOptions && answer.responseOptions.length > 0) {
    answer.responseOriginalText = answer.responseOptions.join(', ');
  } else if (answer.responseRating !== null && answer.responseRating !== undefined) {
    answer.responseOriginalText = this.getTextFromNumericValue(answer.responseRating, "rating");
  }
};

// Helper method to process answer by question type
feedbackResponseSchema.methods.processAnswerByType = function(answer) {
  switch (answer.questionType) {
    case "rating":
      if (answer.responseRating !== null && answer.responseRating !== undefined) {
        answer.responseNumericValue = answer.responseRating;
      } else if (answer.responseText) {
        answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, "rating");
      }
      break;
      
    case "yes_no":
      if (answer.responseText) {
        answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, "yes_no");
      } else if (answer.responseOptions && answer.responseOptions.length > 0) {
        answer.responseNumericValue = this.convertResponseToNumeric(answer.responseOptions[0], "yes_no");
      }
      break;
      
    case "mcq":
    case "radio":
    case "dropdown":
      if (answer.responseOptions && answer.responseOptions.length > 0) {
        answer.responseNumericValue = this.convertResponseToNumeric(answer.responseOptions[0], answer.questionType);
      } else if (answer.responseText) {
        answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, answer.questionType);
      }
      break;
      
    case "grid":
      if (answer.responseText) {
        answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, "grid");
      }
      break;
  }
};

// Create a controller function to process form submission data
const processFeedbackFormSubmission = (formData) => {
  // Extract and map form data to our schema structure
  formData.answers = formData.answers.map(answer => {
    // Use client-provided numeric value if available
    if (answer.numericValue !== undefined) {
      answer.responseNumericValue = answer.numericValue;
    } else {
      // Otherwise calculate it server-side
      const feedbackInstance = new FeedbackResponse();
      const responseValue = answer.responseText || (answer.responseOptions && answer.responseOptions[0]);
      answer.responseNumericValue = feedbackInstance.convertResponseToNumeric(responseValue, answer.questionType);
    }
    
    return answer;
  });
  
  return formData;
};

// Joi Validation for Feedback Response
const validateFeedbackResponse = (data) => {
  const schema = Joi.object({
    formID: Joi.string().hex().length(24).required(),
    formTitle: Joi.string().required().trim(),
    formType: Joi.string().valid("Academic", "Institutional", "Training").required(),
    session: Joi.string().trim(),  // Made optional as it will be auto-generated if not provided
    semesterType: Joi.string().valid("Odd", "Even").required(),
    sessionLabel: Joi.string().allow(null, ''),
    academicType: Joi.string().valid("Theory", "Practical").allow(null),
    studentID: Joi.string().hex().length(24).required(),
    facultyID: Joi.string().hex().length(24).allow(null),
    section: Joi.string().required().trim(),
    semester: Joi.string().required().trim(),
    subject: Joi.string().allow(null, ''),
    commonSemester: Joi.string().allow(null, ''),
    commonSection: Joi.string().allow(null, ''),
    answers: Joi.array().items(
      Joi.object({
        questionID: Joi.string().hex().length(24).required(),
        questionText: Joi.string().required().trim(),
        sectionTitle: Joi.string().required().trim(),
        questionType: Joi.string().valid("rating", "yes_no", "mcq", "text", "grid", "dropdown", "date", "radio").required(),
        responseText: Joi.string().allow('', null),
        responseOptions: Joi.array().items(Joi.string()).allow(null),
        responseRating: Joi.number().min(0).max(5).allow(null),
        responseDate: Joi.date().allow(null),
        // Allow passing numericValue from client
        numericValue: Joi.number().allow(null),
        responseNumericValue: Joi.number().allow(null),
        responseOriginalText: Joi.string().allow('', null)
      })
    ).required(),
    sectionAverages: Joi.array().items(
      Joi.object({
        sectionTitle: Joi.string().required(),
        averageScore: Joi.number(),
        questionCount: Joi.number(),
        countedQuestions: Joi.number()
      })
    ).optional(),
    overallAverage: Joi.number().optional(),
    totalQuestions: Joi.number().optional(),
    countedQuestions: Joi.number().optional(),
    status: Joi.string().valid("submitted", "pending").default("submitted")
  });

  return schema.validate(data);
};

// Create model
const FeedbackResponse = mongoose.model("FeedbackResponse", feedbackResponseSchema);

module.exports = { 
  FeedbackResponse, 
  validateFeedbackResponse, 
  processFeedbackFormSubmission 
};