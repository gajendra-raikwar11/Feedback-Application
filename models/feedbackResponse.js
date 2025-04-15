// const mongoose = require("mongoose");
// const Joi = require("joi");

// // Schema for Feedback Response
// const feedbackResponseSchema = new mongoose.Schema({
//   formID: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "FeedbackForm",
//     required: true
//   },
//   formTitle: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   formType: {
//     type: String,
//     required: true,
//     enum: ["Academic", "Institutional", "Training"]
//   },
//   studentID: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Student",
//     required: true
//   },
//   facultyID: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Faculty",
//     default: null
//   },
//   section: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   semester: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   commonSemester: {
//     type: String,
//     trim: true,
//     default: null
//   },
//   answers: [
//     {
//       questionID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Question",
//         required: true
//       },
//       questionText: {
//         type: String,
//         required: true,
//         trim: true
//       },
//       sectionTitle: {
//         type: String,
//         required: true,
//         trim: true
//       }, // सेक्शन टाइटल जोड़ा गया
//       questionType: {
//         type: String,
//         enum: ["rating", "yes_no", "mcq", "text", "grid", "dropdown", "date","radio"],
//         required: true
//       }, // प्रश्न का प्रकार
//       responseText: { type: String, trim: true, default: null },
//       responseOptions: [{ type: String }],
//       responseRating: { type: Number, min: 1, max: 5, default: null },
//       responseDate: { type: Date, default: null } // यदि तारीख का प्रश्न हो तो
//     }
//   ],
//   status: { type: String, default: "submitted", enum: ["submitted", "pending"] },
//   submittedAt: { type: Date, default: Date.now }
// }, { timestamps: true });

// // Joi Validation for Feedback Response
// const validateFeedbackResponse = (data) => {
//   const schema = Joi.object({
//     formID: Joi.string().hex().length(24).required(),
//     formTitle: Joi.string().required().trim(),
//     formType: Joi.string().valid("Academic", "Institutional", "Training").required(),
//     studentID: Joi.string().hex().length(24).required(),
//     facultyID: Joi.string().hex().length(24).allow(null),
//     section: Joi.string().required().trim(),
//     semester: Joi.string().required().trim(),
//     commonSemester: Joi.string().allow(null),
//     answers: Joi.array().items(
//       Joi.object({
//         questionID: Joi.string().hex().length(24).required(),
//         questionText: Joi.string().required().trim(),
//         sectionTitle: Joi.string().required().trim(),
//         questionType: Joi.string().valid("rating", "yes_no", "mcq", "text", "grid", "dropdown", "date","radio").required(),
//         responseText: Joi.string().allow('', null),
//         responseOptions: Joi.array().items(Joi.string()).allow(null),
//         responseRating: Joi.number().min(1).max(5).allow(null),
//         responseDate: Joi.date().allow(null)
//       })
//     ).required(),
//     status: Joi.string().valid("submitted", "pending").default("submitted")
//   });

//   return schema.validate(data);
// };

// const FeedbackResponse = mongoose.model("FeedbackResponse", feedbackResponseSchema);
// module.exports = { FeedbackResponse, validateFeedbackResponse };

// const mongoose = require("mongoose");
// const Joi = require("joi");

// // Schema for Feedback Response
// const feedbackResponseSchema = new mongoose.Schema({
//   formID: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "FeedbackForm",
//     required: true
//   },
//   formTitle: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   formType: {
//     type: String,
//     required: true,
//     enum: ["Academic", "Institutional", "Training"]
//   },
//   // Added session field to store the current academic session
//   session: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   studentID: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Student",
//     required: true
//   },
//   facultyID: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Faculty",
//     default: null
//   },
//   section: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   semester: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   commonSemester: {
//     type: String,
//     trim: true,
//     default: null
//   },
//   commonSection: {  // Added the commonSection field
//     type: String,
//     trim: true,
//     default: null
//   },
//   answers: [
//     {
//       questionID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Question",
//         required: true
//       },
//       questionText: {
//         type: String,
//         required: true,
//         trim: true
//       },
//       sectionTitle: {
//         type: String,
//         required: true,
//         trim: true
//       },
//       questionType: {
//         type: String,
//         enum: ["rating", "yes_no", "mcq", "text", "grid", "dropdown", "date", "radio"],
//         required: true
//       },
//       responseText: { type: String, trim: true, default: null },
//       responseOptions: [{ type: String }],
//       responseRating: { type: Number, min: 1, max: 5, default: null },
//       responseDate: { type: Date, default: null },
//       // New field to store numeric value for any response type
//       responseNumericValue: { type: Number, default: null },
//       // Optional field to store the original text response for reference
//       responseOriginalText: { type: String, trim: true, default: null }
//     }
//   ],
//   // New field to store average scores for each section
//   sectionAverages: [{
//     sectionTitle: { type: String, required: true },
//     averageScore: { type: Number, default: 0 }
//   }],
//   // Overall average score for the entire feedback
//   overallAverage: { type: Number, default: 0 },
//   status: { type: String, default: "submitted", enum: ["submitted", "pending"] },
//   submittedAt: { type: Date, default: Date.now }
// }, { timestamps: true });

// // Helper method to convert text responses to numeric values
// feedbackResponseSchema.methods.convertResponseToNumeric = function(responseText, questionType) {
//   // For scale: Poor, Average, Good, Very Good, Excellent, No Opinion
//   const scaleMap1 = {
//     "Poor": 1,
//     "Average": 2,
//     "Good": 3,
//     "Very Good": 4,
//     "Excellent": 5,
//     "No Opinion": 0
//   };
  
//   // For Yes/No: No, Yes, No Opinion
//   const yesNoMap = {
//     "No": 0,
//     "Yes": 1,
//     "No Opinion": null
//   };
  
//   // For weight scale: Just right, Too light, Too Heavy, No Opinion
//   const weightMap = {
//     "Just right": 2,
//     "Too light": 1,
//     "Too Heavy": 3,
//     "No Opinion": 0
//   };
  
//   // For satisfaction scale: Very Good, Good, Fair, Satisfactory, Unsatisfied
//   const satisfactionMap = {
//     "Very Good": 5,
//     "Good": 4,
//     "Fair": 3,
//     "Satisfactory": 2,
//     "Unsatisfied": 1
//   };
  
//   if (questionType === "rating") {
//     // Rating is already numeric (1-5)
//     return responseText ? Number(responseText) : null;
//   } else if (questionType === "yes_no") {
//     return yesNoMap[responseText] ?? null;
//   } else if (questionType === "mcq" || questionType === "radio") {
//     // Try to match with any of the scales
//     if (scaleMap1[responseText] !== undefined) {
//       return scaleMap1[responseText];
//     } else if (yesNoMap[responseText] !== undefined) {
//       return yesNoMap[responseText];
//     } else if (weightMap[responseText] !== undefined) {
//       return weightMap[responseText];
//     } else if (satisfactionMap[responseText] !== undefined) {
//       return satisfactionMap[responseText];
//     }
//   }
  
//   return null; // Default if no match found
// };

// // Method to calculate averages after submission
// feedbackResponseSchema.methods.calculateAverages = function() {
//   const sectionMap = {};
//   let totalScore = 0;
//   let totalQuestions = 0;
  
//   // Group answers by section and calculate section averages
//   this.answers.forEach(answer => {
//     if (answer.responseNumericValue !== null) {
//       if (!sectionMap[answer.sectionTitle]) {
//         sectionMap[answer.sectionTitle] = {
//           totalScore: 0,
//           count: 0
//         };
//       }
      
//       sectionMap[answer.sectionTitle].totalScore += answer.responseNumericValue;
//       sectionMap[answer.sectionTitle].count++;
      
//       totalScore += answer.responseNumericValue;
//       totalQuestions++;
//     }
//   });
  
//   // Calculate section averages
//   this.sectionAverages = Object.keys(sectionMap).map(section => {
//     const avg = sectionMap[section].totalScore / sectionMap[section].count;
//     return {
//       sectionTitle: section,
//       averageScore: parseFloat(avg.toFixed(2))
//     };
//   });
  
//   // Calculate overall average
//   if (totalQuestions > 0) {
//     this.overallAverage = parseFloat((totalScore / totalQuestions).toFixed(2));
//   }
  
//   return this;
// };

// // Helper method to determine the current academic session
// feedbackResponseSchema.methods.determineCurrentSession = function() {
//   const currentDate = new Date();
//   const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
//   const currentYear = currentDate.getFullYear();
  
//   // January (0) to June (5)
//   if (currentMonth >= 0 && currentMonth <= 5) {
//     return `${currentYear} (Jan - June)`;
//   } 
//   // September (8) to December (11)
//   else if (currentMonth >= 8 && currentMonth <= 11) {
//     return `${currentYear} (Sep - Dec)`;
//   }
//   // July (6) to August (7)
//   else {
//     return `${currentYear} (Jul - Aug)`;
//   }
// };

// // Middleware to convert responses, calculate averages, and set session before saving
// feedbackResponseSchema.pre('save', function(next) {
//   // Set session if not already provided
//   if (!this.session) {
//     this.session = this.determineCurrentSession();
//   }
  
//   // Convert text responses to numeric values if not already done
//   this.answers.forEach(answer => {
//     if (answer.responseNumericValue === null && answer.responseOptions && answer.responseOptions.length > 0) {
//       // Store original response text
//       answer.responseOriginalText = answer.responseOptions.join(', ');
//       // Convert to numeric value
//       const responseText = answer.responseOptions[0]; // Assuming single selection
//       answer.responseNumericValue = this.convertResponseToNumeric(responseText, answer.questionType);
//     } else if (answer.questionType === "rating" && answer.responseRating !== null) {
//       answer.responseNumericValue = answer.responseRating;
//     }
//   });
  
//   // Calculate averages
//   this.calculateAverages();
  
//   next();
// });

// // Joi Validation for Feedback Response
// const validateFeedbackResponse = (data) => {
//   const schema = Joi.object({
//     formID: Joi.string().hex().length(24).required(),
//     formTitle: Joi.string().required().trim(),
//     formType: Joi.string().valid("Academic", "Institutional", "Training").required(),
//     session: Joi.string().trim(),  // Made optional as it will be auto-generated if not provided
//     studentID: Joi.string().hex().length(24).required(),
//     facultyID: Joi.string().hex().length(24).allow(null),
//     section: Joi.string().required().trim(),
//     semester: Joi.string().required().trim(),
//     commonSemester: Joi.string().allow(null, ''),
//     commonSection: Joi.string().allow(null, ''),  // Added validation for commonSection
//     answers: Joi.array().items(
//       Joi.object({
//         questionID: Joi.string().hex().length(24).required(),
//         questionText: Joi.string().required().trim(),
//         sectionTitle: Joi.string().required().trim(),
//         questionType: Joi.string().valid("rating", "yes_no", "mcq", "text", "grid", "dropdown", "date", "radio").required(),
//         responseText: Joi.string().allow('', null),
//         responseOptions: Joi.array().items(Joi.string()).allow(null),
//         responseRating: Joi.number().min(1).max(5).allow(null),
//         responseDate: Joi.date().allow(null),
//         responseNumericValue: Joi.number().allow(null),
//         responseOriginalText: Joi.string().allow('', null)
//       })
//     ).required(),
//     sectionAverages: Joi.array().items(
//       Joi.object({
//         sectionTitle: Joi.string().required(),
//         averageScore: Joi.number()
//       })
//     ),
//     overallAverage: Joi.number(),
//     status: Joi.string().valid("submitted", "pending").default("submitted")
//   });

//   return schema.validate(data);
// };

// // Create model
// const FeedbackResponse = mongoose.model("FeedbackResponse", feedbackResponseSchema);

// module.exports = { FeedbackResponse, validateFeedbackResponse };


const mongoose = require("mongoose");
const Joi = require("joi");

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
  commonSection: {  // Added the commonSection field
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
      responseRating: { type: Number, min: 0, max: 5, default: null }, // Changed to min: 0 for "Poor" rating
      responseDate: { type: Date, default: null },
      // Field to store numeric value for any response type
      responseNumericValue: { type: Number, default: null },
      // Store the original text response for reference
      responseOriginalText: { type: String, trim: true, default: null }
    }
  ],
  // Store average scores for each section
  sectionAverages: [{
    sectionTitle: { type: String, required: true },
    averageScore: { type: Number, default: 0 }
  }],
  // Overall average score for the entire feedback
  overallAverage: { type: Number, default: 0 },
  status: { type: String, default: "submitted", enum: ["submitted", "pending"] },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Helper method to convert text responses to numeric values
// Helper method to convert text responses to numeric values
feedbackResponseSchema.methods.convertResponseToNumeric = function(responseText, questionType) {
  // For rating scale: Poor, Average, Good, Very Good, Excellent, No Opinion
  const ratingMap = {
    "Poor": 0,
    "Average": 1,
    "Good": 2,
    "Very Good": 3,
    "Excellent": 4,
    "No Opinion": null // Using null to exclude from averages
  };
  
  // For Yes/No: Yes, No, No Opinion
  const yesNoMap = {
    "Yes": 1,    // Changed to 1 for positive response
    "No": 0,     // Changed to 0 for negative response
    "No Opinion": null  // Using null to exclude from averages
  };
  
  // For weight scale: Just right, Too light, Too Heavy, No Opinion
  const weightMap = {
    "Just right": 2,
    "Too light": 1,
    "Too Heavy": 3,
    "No Opinion": null  // Using null to exclude from averages
  };
  
  // For satisfaction scale: Very Good, Good, Fair, Satisfactory, Unsatisfied
  const satisfactionMap = {
    "Very Good": 4,
    "Good": 3,
    "Fair": 2,
    "Satisfactory": 1,
    "Unsatisfied": 0
  };
  
  // For agreement scale: Strongly Agree, Agree, Neutral, Disagree, Strongly Disagree
  const agreementMap = {
    "Strongly Agree": 4,
    "Agree": 3,
    "Neutral": 2,
    "Disagree": 1,
    "Strongly Disagree": 0,
    "No Opinion": null  // Using null to exclude from averages
  };
  
  // For frequency scale: Always, Frequently, Sometimes, Rarely, Never
  const frequencyMap = {
    "Always": 4,
    "Frequently": 3,
    "Sometimes": 2,
    "Rarely": 1,
    "Never": 0,
    "No Opinion": null
  };

  if (!responseText) {
    return null;
  }
  
  if (questionType === "rating") {
    // Check if responseText is already a number
    if (!isNaN(responseText)) {
      return Number(responseText);
    }
    // Otherwise try to match with rating scale
    return ratingMap[responseText] !== undefined ? ratingMap[responseText] : null;
  } else if (questionType === "yes_no") {
    return yesNoMap[responseText] !== undefined ? yesNoMap[responseText] : null;
  } else if (questionType === "mcq" || questionType === "radio" || questionType === "dropdown") {
    // Try to match with any of the scales
    const allMaps = [
      ratingMap, 
      yesNoMap, 
      weightMap, 
      satisfactionMap, 
      agreementMap, 
      frequencyMap
    ];
    
    for (const map of allMaps) {
      if (map[responseText] !== undefined) {
        return map[responseText];
      }
    }
    
    // If it's not in any of our maps but is a number, convert it
    if (!isNaN(responseText)) {
      return Number(responseText);
    }
  } else if (questionType === "grid") {
    // For grid responses, we may receive a specific value or need to map row/column combination
    if (!isNaN(responseText)) {
      return Number(responseText);
    }
    
    // If it's a combined response like "Row: Very Satisfied", try to extract meaning
    const satisfactionTerms = ["satisfied", "good", "excellent", "poor", "average"];
    const agreementTerms = ["agree", "disagree", "neutral"];
    
    const lowerText = responseText.toLowerCase();
    
    if (satisfactionTerms.some(term => lowerText.includes(term))) {
      if (lowerText.includes("very satisfied") || lowerText.includes("excellent")) return 4;
      if (lowerText.includes("satisfied") || lowerText.includes("good")) return 3;
      if (lowerText.includes("average") || lowerText.includes("neutral")) return 2;
      if (lowerText.includes("unsatisfied") || lowerText.includes("poor")) return 1;
      if (lowerText.includes("very unsatisfied")) return 0;
    }
    
    if (agreementTerms.some(term => lowerText.includes(term))) {
      if (lowerText.includes("strongly agree")) return 4;
      if (lowerText.includes("agree") && !lowerText.includes("strongly") && !lowerText.includes("dis")) return 3;
      if (lowerText.includes("neutral")) return 2;
      if (lowerText.includes("disagree") && !lowerText.includes("strongly")) return 1;
      if (lowerText.includes("strongly disagree")) return 0;
    }
  }
  
  // If no matches found and it's not a numeric value, return null
  return null;
};

// Helper method to get the text representation of a rating value
// Helper method to get the text representation of a rating value
feedbackResponseSchema.methods.getRatingText = function(value) {
  const ratingTexts = ["Poor", "Average", "Good", "Very Good", "Excellent"];
  return (value >= 0 && value < ratingTexts.length) ? ratingTexts[value] : "No Opinion";
};

// Helper method to get the text representation of a yes/no value
feedbackResponseSchema.methods.getYesNoText = function(value) {
  if (value === 1) return "Yes";
  if (value === 0) return "No";
  return "No Opinion";
};

// Helper method to get text representation of satisfaction value
feedbackResponseSchema.methods.getSatisfactionText = function(value) {
  const satisfactionTexts = ["Unsatisfied", "Satisfactory", "Fair", "Good", "Very Good"];
  return (value >= 0 && value < satisfactionTexts.length) ? satisfactionTexts[value] : "No Opinion";
};

// Helper method to get text representation of agreement value
feedbackResponseSchema.methods.getAgreementText = function(value) {
  const agreementTexts = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
  return (value >= 0 && value < agreementTexts.length) ? agreementTexts[value] : "No Opinion";
};

// Helper method to get most appropriate text based on numeric value and question type
feedbackResponseSchema.methods.getTextFromNumericValue = function(value, questionType) {
  if (value === null || value === undefined) return "No Response";
  
  switch (questionType) {
    case "rating":
      return this.getRatingText(value);
    case "yes_no":
      return this.getYesNoText(value);
    case "mcq":
    case "radio":
    case "dropdown":
      // Try different scales to see which makes more sense
      if (value >= 0 && value <= 4) {
        // Could be rating, satisfaction, or agreement
        const ratingText = this.getRatingText(value);
        const satisfactionText = this.getSatisfactionText(value);
        const agreementText = this.getAgreementText(value);
        
        // You could implement more complex logic here to determine which is most appropriate
        return ratingText;
      }
      return value.toString();
    default:
      return value.toString();
  }
};

// Helper method to get the text representation of a yes/no value
feedbackResponseSchema.methods.getYesNoText = function(value) {
  const yesNoTexts = ["Yes", "No", "No Opinion"];
  return value >= 0 && value < yesNoTexts.length ? yesNoTexts[value] : null;
};

// Method to calculate averages after submission
// Method to calculate averages after submission
feedbackResponseSchema.methods.calculateAverages = function() {
  const sectionMap = {};
  let totalScore = 0;
  let totalQuestions = 0;
  
  // Group answers by section and calculate section averages
  this.answers.forEach(answer => {
    // Skip answers without numeric values or text-based questions
    if (answer.responseNumericValue === null || 
        answer.responseNumericValue === undefined || 
        answer.questionType === "text" || 
        answer.questionType === "date") {
      return;
    }
    
    // Initialize section if it doesn't exist
    if (!sectionMap[answer.sectionTitle]) {
      sectionMap[answer.sectionTitle] = {
        totalScore: 0,
        count: 0,
        questions: []
      };
    }
    
    // Add to section totals
    sectionMap[answer.sectionTitle].totalScore += answer.responseNumericValue;
    sectionMap[answer.sectionTitle].count++;
    sectionMap[answer.sectionTitle].questions.push({
      id: answer.questionID,
      value: answer.responseNumericValue
    });
    
    // Add to overall totals
    totalScore += answer.responseNumericValue;
    totalQuestions++;
  });
  
  // Calculate section averages
  this.sectionAverages = Object.keys(sectionMap).map(section => {
    const sectionData = sectionMap[section];
    const avg = sectionData.count > 0 ? 
      sectionData.totalScore / sectionData.count : 0;
      
    return {
      sectionTitle: section,
      averageScore: parseFloat(avg.toFixed(2)),
      questionCount: sectionData.count
    };
  });
  
  // Calculate overall average
  if (totalQuestions > 0) {
    this.overallAverage = parseFloat((totalScore / totalQuestions).toFixed(2));
  } else {
    this.overallAverage = 0;
  }
  
  return this;
};

// Helper method to determine the current academic session
feedbackResponseSchema.methods.determineCurrentSession = function() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
  const currentYear = currentDate.getFullYear();
  
  // January (0) to June (5)
  if (currentMonth >= 0 && currentMonth <= 5) {
    return `${currentYear} (Jan - June)`;
  } 
  // September (8) to December (11)
  else if (currentMonth >= 8 && currentMonth <= 11) {
    return `${currentYear} (Sep - Dec)`;
  }
  // July (6) to August (7)
  else {
    return `${currentYear} (Jul - Aug)`;
  }
};

// Middleware to convert responses, calculate averages, and set session before saving
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
  
  // Convert text responses to numeric values
  this.answers.forEach(answer => {
    // Store original response first
    if (answer.responseText) {
      answer.responseOriginalText = answer.responseText;
    } else if (answer.responseOptions && answer.responseOptions.length > 0) {
      answer.responseOriginalText = answer.responseOptions.join(', ');
    } else if (answer.responseRating !== null && answer.responseRating !== undefined) {
      answer.responseOriginalText = this.getRatingText(answer.responseRating);
    }
    
    // Now convert to numeric value based on question type
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
        
      case "text":
        // For text responses, we don't typically assign numeric values
        // but you could implement sentiment analysis or other scoring in the future
        break;
        
      case "date":
        // For date responses, we don't typically assign numeric values
        // but you could calculate days from reference date if needed
        break;
    }
  });
  
  // Calculate averages
  this.calculateAverages();
  
  next();
});

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
        responseNumericValue: Joi.number().allow(null),
        responseOriginalText: Joi.string().allow('', null)
      })
    ).required(),
    sectionAverages: Joi.array().items(
      Joi.object({
        sectionTitle: Joi.string().required(),
        averageScore: Joi.number()
      })
    ).optional(),
    overallAverage: Joi.number().optional(),
    status: Joi.string().valid("submitted", "pending").default("submitted")
  });

  return schema.validate(data);
};

// Create model
const FeedbackResponse = mongoose.model("FeedbackResponse", feedbackResponseSchema);

module.exports = { FeedbackResponse, validateFeedbackResponse };