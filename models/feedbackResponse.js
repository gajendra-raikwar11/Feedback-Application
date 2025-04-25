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
//   // Session fields from FeedbackForm schema
//   session: {
//     type: String,
//     required: true,
//     trim: true // e.g., "2024-25" or "2024 (Jan - June)"
//   },
//   semesterType: {
//     type: String,
//     required: true,
//     enum: ["Odd", "Even"]
//   },
//   sessionLabel: {
//     type: String,
//     trim: true // e.g., "2024-25 Jan-June"
//   },
//   // Academic type if applicable
//   academicType: {
//     type: String,
//     enum: ["Theory", "Practical"],
//     default: null
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
//   subject: {
//     type: String,
//     trim: true,
//     default: null
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
//       responseRating: { type: Number, min: 0, max: 5, default: null }, // Changed to min: 0 for "Poor" rating
//       responseDate: { type: Date, default: null },
//       // Field to store numeric value for any response type
//       responseNumericValue: { type: Number, default: null },
//       // Store the original text response for reference
//       responseOriginalText: { type: String, trim: true, default: null }
//     }
//   ],
//   // Store average scores for each section
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
//   // For rating scale: Poor, Average, Good, Very Good, Excellent, No Opinion
//   const ratingMap = {
//     "Poor": 1,
//     "Average": 2,
//     "Good": 3,
//     "Very Good": 4,
//     "Excellent": 5,
//     "No Opinion": null // Using null to exclude from averages
//   };
  
//   // For Yes/No: Yes, No, No Opinion
//   const yesNoMap = {
//     "Yes": 5,    // Changed to 1 for positive response
//     "No": 0,     // Changed to 0 for negative response
//     "No Opinion": null  // Using null to exclude from averages
//   };
  
//   // For weight scale: Just right, Too light, Too Heavy, No Opinion
//   const weightMap = {
//     "Just right": 3,
//     "Too light": 1,
//     "Too Heavy": 5,
//     "No Opinion": null  // Using null to exclude from averages
//   };
  
//   // For satisfaction scale: Very Good, Good, Fair, Satisfactory, Unsatisfied
//   const satisfactionMap = {
//     "Very Good": 5,
//     "Good": 4,
//     "Fair": 3,
//     "Satisfactory": 2,
//     "Unsatisfied": 1
//   };
  
//   // For agreement scale: Strongly Agree, Agree, Neutral, Disagree, Strongly Disagree
//   const agreementMap = {
//     "Strongly Agree": 5,
//     "Agree": 4,
//     "Neutral": 3,
//     "Disagree": 2,
//     "Strongly Disagree": 1,
//     "No Opinion": null  // Using null to exclude from averages
//   };
  
//   // For frequency scale: Always, Frequently, Sometimes, Rarely, Never
//   const frequencyMap = {
//     "Always": 5,
//     "Frequently":4,
//     "Sometimes": 3,
//     "Rarely": 2,
//     "Never": 1,
//     "No Opinion": null
//   };

//   if (!responseText) {
//     return null;
//   }
  
//   if (questionType === "rating") {
//     // Check if responseText is already a number
//     if (!isNaN(responseText)) {
//       return Number(responseText);
//     }
//     // Otherwise try to match with rating scale
//     return ratingMap[responseText] !== undefined ? ratingMap[responseText] : null;
//   } else if (questionType === "yes_no") {
//     return yesNoMap[responseText] !== undefined ? yesNoMap[responseText] : null;
//   } else if (questionType === "mcq" || questionType === "radio" || questionType === "dropdown") {
//     // Try to match with any of the scales
//     const allMaps = [
//       ratingMap, 
//       yesNoMap, 
//       weightMap, 
//       satisfactionMap, 
//       agreementMap, 
//       frequencyMap
//     ];
    
//     for (const map of allMaps) {
//       if (map[responseText] !== undefined) {
//         return map[responseText];
//       }
//     }
    
//     // If it's not in any of our maps but is a number, convert it
//     if (!isNaN(responseText)) {
//       return Number(responseText);
//     }
//   } else if (questionType === "grid") {
//     // For grid responses, we may receive a specific value or need to map row/column combination
//     if (!isNaN(responseText)) {
//       return Number(responseText);
//     }
    
//     // If it's a combined response like "Row: Very Satisfied", try to extract meaning
//     const satisfactionTerms = ["satisfied", "good", "excellent", "poor", "average"];
//     const agreementTerms = ["agree", "disagree", "neutral"];
    
//     const lowerText = responseText.toLowerCase();
    
//     if (satisfactionTerms.some(term => lowerText.includes(term))) {
//       if (lowerText.includes("very satisfied") || lowerText.includes("excellent")) return 4;
//       if (lowerText.includes("satisfied") || lowerText.includes("good")) return 3;
//       if (lowerText.includes("average") || lowerText.includes("neutral")) return 2;
//       if (lowerText.includes("unsatisfied") || lowerText.includes("poor")) return 1;
//       if (lowerText.includes("very unsatisfied")) return 0;
//     }
    
//     if (agreementTerms.some(term => lowerText.includes(term))) {
//       if (lowerText.includes("strongly agree")) return 4;
//       if (lowerText.includes("agree") && !lowerText.includes("strongly") && !lowerText.includes("dis")) return 3;
//       if (lowerText.includes("neutral")) return 2;
//       if (lowerText.includes("disagree") && !lowerText.includes("strongly")) return 1;
//       if (lowerText.includes("strongly disagree")) return 0;
//     }
//   }
  
//   // If no matches found and it's not a numeric value, return null
//   return null;
// };

// // Helper method to get the text representation of a rating value
// feedbackResponseSchema.methods.getRatingText = function(value) {
//   const ratingTexts = ["Poor", "Average", "Good", "Very Good", "Excellent"];
//   return (value >= 0 && value < ratingTexts.length) ? ratingTexts[value] : "No Opinion";
// };

// // Helper method to get the text representation of a yes/no value
// feedbackResponseSchema.methods.getYesNoText = function(value) {
//   if (value === 5) return "Yes";
//   if (value === 0) return "No";
//   return "No Opinion";
// };

// // Helper method to get text representation of satisfaction value
// feedbackResponseSchema.methods.getSatisfactionText = function(value) {
//   const satisfactionTexts = ["Unsatisfied", "Satisfactory", "Fair", "Good", "Very Good"];
//   return (value >= 0 && value < satisfactionTexts.length) ? satisfactionTexts[value] : "No Opinion";
// };

// // Helper method to get text representation of agreement value
// feedbackResponseSchema.methods.getAgreementText = function(value) {
//   const agreementTexts = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
//   return (value >= 0 && value < agreementTexts.length) ? agreementTexts[value] : "No Opinion";
// };

// // Helper method to get most appropriate text based on numeric value and question type
// feedbackResponseSchema.methods.getTextFromNumericValue = function(value, questionType) {
//   if (value === null || value === undefined) return "No Response";
  
//   switch (questionType) {
//     case "rating":
//       return this.getRatingText(value);
//     case "yes_no":
//       return this.getYesNoText(value);
//     case "mcq":
//     case "radio":
//     case "dropdown":
//       // Try different scales to see which makes more sense
//       if (value >= 0 && value <= 5) {
//         // Could be rating, satisfaction, or agreement
//         const ratingText = this.getRatingText(value);
//         const satisfactionText = this.getSatisfactionText(value);
//         const agreementText = this.getAgreementText(value);
        
//         // You could implement more complex logic here to determine which is most appropriate
//         return ratingText;
//       }
//       return value.toString();
//     default:
//       return value.toString();
//   }
// };

// // Helper method to get the text representation of a yes/no value
// feedbackResponseSchema.methods.getYesNoText = function(value) {
//   const yesNoTexts = ["Yes", "No", "No Opinion"];
//   return value >= 0 && value < yesNoTexts.length ? yesNoTexts[value] : null;
// };

// // Method to calculate averages after submission
// feedbackResponseSchema.methods.calculateAverages = function() {
//   const sectionMap = {};
//   let totalScore = 0;
//   let totalQuestions = 0;
  
//   // Group answers by section and calculate section averages
//   this.answers.forEach(answer => {
//     // Skip answers without numeric values or text-based questions
//     if (answer.responseNumericValue === null || 
//         answer.responseNumericValue === undefined || 
//         answer.questionType === "text" || 
//         answer.questionType === "date") {
//       return;
//     }
    
//     // Initialize section if it doesn't exist
//     if (!sectionMap[answer.sectionTitle]) {
//       sectionMap[answer.sectionTitle] = {
//         totalScore: 0,
//         count: 0,
//         questions: []
//       };
//     }
    
//     // Add to section totals
//     sectionMap[answer.sectionTitle].totalScore += answer.responseNumericValue;
//     sectionMap[answer.sectionTitle].count++;
//     sectionMap[answer.sectionTitle].questions.push({
//       id: answer.questionID,
//       value: answer.responseNumericValue
//     });
    
//     // Add to overall totals
//     totalScore += answer.responseNumericValue;
//     totalQuestions++;
//   });
  
//   // Calculate section averages
//   this.sectionAverages = Object.keys(sectionMap).map(section => {
//     const sectionData = sectionMap[section];
//     const avg = sectionData.count > 0 ? 
//       sectionData.totalScore / sectionData.count : 0;
      
//     return {
//       sectionTitle: section,
//       averageScore: parseFloat(avg.toFixed(2)),
//       questionCount: sectionData.count
//     };
//   });
  
//   // Calculate overall average
//   if (totalQuestions > 0) {
//     this.overallAverage = parseFloat((totalScore / totalQuestions).toFixed(2));
//   } else {
//     this.overallAverage = 0;
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
  
//   // Set session label if not provided
//   if (!this.sessionLabel) {
//     const year = this.session.split(' ')[0];
//     const period = this.semesterType === "Odd" ? "Jul-Dec" : "Jan-Jun";
//     this.sessionLabel = `${year} ${period}`;
//   }
  
//   // Convert text responses to numeric values
//   this.answers.forEach(answer => {
//     // Store original response first
//     if (answer.responseText) {
//       answer.responseOriginalText = answer.responseText;
//     } else if (answer.responseOptions && answer.responseOptions.length > 0) {
//       answer.responseOriginalText = answer.responseOptions.join(', ');
//     } else if (answer.responseRating !== null && answer.responseRating !== undefined) {
//       answer.responseOriginalText = this.getRatingText(answer.responseRating);
//     }
    
//     // Now convert to numeric value based on question type
//     switch (answer.questionType) {
//       case "rating":
//         if (answer.responseRating !== null && answer.responseRating !== undefined) {
//           answer.responseNumericValue = answer.responseRating;
//         } else if (answer.responseText) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, "rating");
//         }
//         break;
        
//       case "yes_no":
//         if (answer.responseText) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, "yes_no");
//         } else if (answer.responseOptions && answer.responseOptions.length > 0) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseOptions[0], "yes_no");
//         }
//         break;
        
//       case "mcq":
//       case "radio":
//       case "dropdown":
//         if (answer.responseOptions && answer.responseOptions.length > 0) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseOptions[0], answer.questionType);
//         } else if (answer.responseText) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, answer.questionType);
//         }
//         break;
        
//       case "grid":
//         if (answer.responseText) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, "grid");
//         }
//         break;
        
//       case "text":
//         // For text responses, we don't typically assign numeric values
//         // but you could implement sentiment analysis or other scoring in the future
//         break;
        
//       case "date":
//         // For date responses, we don't typically assign numeric values
//         // but you could calculate days from reference date if needed
//         break;
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
//     semesterType: Joi.string().valid("Odd", "Even").required(),
//     sessionLabel: Joi.string().allow(null, ''),
//     academicType: Joi.string().valid("Theory", "Practical").allow(null),
//     studentID: Joi.string().hex().length(24).required(),
//     facultyID: Joi.string().hex().length(24).allow(null),
//     section: Joi.string().required().trim(),
//     semester: Joi.string().required().trim(),
//     subject: Joi.string().allow(null, ''),
//     commonSemester: Joi.string().allow(null, ''),
//     commonSection: Joi.string().allow(null, ''),
//     answers: Joi.array().items(
//       Joi.object({
//         questionID: Joi.string().hex().length(24).required(),
//         questionText: Joi.string().required().trim(),
//         sectionTitle: Joi.string().required().trim(),
//         questionType: Joi.string().valid("rating", "yes_no", "mcq", "text", "grid", "dropdown", "date", "radio").required(),
//         responseText: Joi.string().allow('', null),
//         responseOptions: Joi.array().items(Joi.string()).allow(null),
//         responseRating: Joi.number().min(0).max(5).allow(null),
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
//     ).optional(),
//     overallAverage: Joi.number().optional(),
//     status: Joi.string().valid("submitted", "pending").default("submitted")
//   });

//   return schema.validate(data);
// };
// // Create model
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
//   // Session fields from FeedbackForm schema
//   session: {
//     type: String,
//     required: true,
//     trim: true // e.g., "2024-25" or "2024 (Jan - June)"
//   },
//   semesterType: {
//     type: String,
//     required: true,
//     enum: ["Odd", "Even"]
//   },
//   sessionLabel: {
//     type: String,
//     trim: true // e.g., "2024-25 Jan-June"
//   },
//   // Academic type if applicable
//   academicType: {
//     type: String,
//     enum: ["Theory", "Practical"],
//     default: null
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
//   subject: {
//     type: String,
//     trim: true,
//     default: null
//   },
//   commonSemester: {
//     type: String,
//     trim: true,
//     default: null
//   },
//   commonSection: {
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
//       responseRating: { type: Number, min: 0, max: 5, default: null }, // Changed to min: 0 for "Poor" rating
//       responseDate: { type: Date, default: null },
//       // Field to store numeric value for any response type
//       responseNumericValue: { type: Number, default: null },
//       // Store the original text response for reference
//       responseOriginalText: { type: String, trim: true, default: null }
//     }
//   ],
//   // Store average scores for each section
//   sectionAverages: [{
//     sectionTitle: { type: String, required: true },
//     averageScore: { type: Number, default: 0 },
//     questionCount: { type: Number, default: 0 }, // Total questions in section
//     countedQuestions: { type: Number, default: 0 } // Questions actually counted (excluding "No Opinion")
//   }],
//   // Overall average score for the entire feedback
//   overallAverage: { type: Number, default: 0 },
//   totalQuestions: { type: Number, default: 0 },
//   countedQuestions: { type: Number, default: 0 }, // Questions actually counted for overall average
//   status: { type: String, default: "submitted", enum: ["submitted", "pending"] },
//   submittedAt: { type: Date, default: Date.now }
// }, { timestamps: true });

// // Helper method to convert text responses to numeric values
// feedbackResponseSchema.methods.convertResponseToNumeric = function(responseText, questionType) {
//   // For rating scale: Poor, Average, Good, Very Good, Excellent, No Opinion
//   const ratingMap = {
//     "Poor": 1,
//     "Average": 2,
//     "Good": 3,
//     "Very Good": 4,
//     "Excellent": 5,
//     "No Opinion": null // Using null to exclude from averages
//   };
  
//   // For Yes/No: Yes, No, No Opinion
//   const yesNoMap = {
//     "Yes": 5,    // Changed to 5 for positive response
//     "No": 0,     // Changed to 0 for negative response
//     "No Opinion": null  // Using null to exclude from averages
//   };
  
//   // For weight scale: Just right, Too light, Too Heavy, No Opinion
//   const weightMap = {
//     "Just right": 3,
//     "Too light": 1,
//     "Too Heavy": 5,
//     "No Opinion": null  // Using null to exclude from averages
//   };
  
//   // For satisfaction scale: Very Good, Good, Fair, Satisfactory, Unsatisfied
//   const satisfactionMap = {
//     "Very Good": 5,
//     "Good": 4,
//     "Fair": 3,
//     "Satisfactory": 2,
//     "Unsatisfied": 1
//   };
  
//   // For agreement scale: Strongly Agree, Agree, Neutral, Disagree, Strongly Disagree
//   const agreementMap = {
//     "Strongly Agree": 5,
//     "Agree": 4,
//     "Neutral": 3,
//     "Disagree": 2,
//     "Strongly Disagree": 1,
//     "No Opinion": null  // Using null to exclude from averages
//   };
  
//   // For frequency scale: Always, Frequently, Sometimes, Rarely, Never
//   const frequencyMap = {
//     "Always": 5,
//     "Frequently": 4,
//     "Sometimes": 3,
//     "Rarely": 2,
//     "Never": 1,
//     "No Opinion": null
//   };

//   if (!responseText) {
//     return null;
//   }
  
//   if (questionType === "rating") {
//     // Check if responseText is already a number
//     if (!isNaN(responseText)) {
//       return Number(responseText);
//     }
//     // Otherwise try to match with rating scale
//     return ratingMap[responseText] !== undefined ? ratingMap[responseText] : null;
//   } else if (questionType === "yes_no") {
//     return yesNoMap[responseText] !== undefined ? yesNoMap[responseText] : null;
//   } else if (questionType === "mcq" || questionType === "radio" || questionType === "dropdown") {
//     // Try to match with any of the scales
//     const allMaps = [
//       ratingMap, 
//       yesNoMap, 
//       weightMap, 
//       satisfactionMap, 
//       agreementMap, 
//       frequencyMap
//     ];
    
//     for (const map of allMaps) {
//       if (map[responseText] !== undefined) {
//         return map[responseText];
//       }
//     }
    
//     // If it's not in any of our maps but is a number, convert it
//     if (!isNaN(responseText)) {
//       return Number(responseText);
//     }
//   } else if (questionType === "grid") {
//     // For grid responses, we may receive a specific value or need to map row/column combination
//     if (!isNaN(responseText)) {
//       return Number(responseText);
//     }
    
//     // If it's a combined response like "Row: Very Satisfied", try to extract meaning
//     const satisfactionTerms = ["satisfied", "good", "excellent", "poor", "average"];
//     const agreementTerms = ["agree", "disagree", "neutral"];
    
//     const lowerText = responseText.toLowerCase();
    
//     if (satisfactionTerms.some(term => lowerText.includes(term))) {
//       if (lowerText.includes("very satisfied") || lowerText.includes("excellent")) return 4;
//       if (lowerText.includes("satisfied") || lowerText.includes("good")) return 3;
//       if (lowerText.includes("average") || lowerText.includes("neutral")) return 2;
//       if (lowerText.includes("unsatisfied") || lowerText.includes("poor")) return 1;
//       if (lowerText.includes("very unsatisfied")) return 0;
//     }
    
//     if (agreementTerms.some(term => lowerText.includes(term))) {
//       if (lowerText.includes("strongly agree")) return 4;
//       if (lowerText.includes("agree") && !lowerText.includes("strongly") && !lowerText.includes("dis")) return 3;
//       if (lowerText.includes("neutral")) return 2;
//       if (lowerText.includes("disagree") && !lowerText.includes("strongly")) return 1;
//       if (lowerText.includes("strongly disagree")) return 0;
//     }
//   }
  
//   // If no matches found and it's not a numeric value, return null
//   return null;
// };

// // Helper method to get the text representation of a rating value
// feedbackResponseSchema.methods.getRatingText = function(value) {
//   const ratingTexts = ["Poor", "Average", "Good", "Very Good", "Excellent"];
//   return (value >= 0 && value < ratingTexts.length) ? ratingTexts[value] : "No Opinion";
// };

// // Helper method to get the text representation of a yes/no value
// feedbackResponseSchema.methods.getYesNoText = function(value) {
//   if (value === 5) return "Yes";
//   if (value === 0) return "No";
//   return "No Opinion";
// };

// // Helper method to get text representation of satisfaction value
// feedbackResponseSchema.methods.getSatisfactionText = function(value) {
//   const satisfactionTexts = ["Unsatisfied", "Satisfactory", "Fair", "Good", "Very Good"];
//   return (value >= 0 && value < satisfactionTexts.length) ? satisfactionTexts[value] : "No Opinion";
// };

// // Helper method to get text representation of agreement value
// feedbackResponseSchema.methods.getAgreementText = function(value) {
//   const agreementTexts = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
//   return (value >= 0 && value < agreementTexts.length) ? agreementTexts[value] : "No Opinion";
// };

// // Helper method to get most appropriate text based on numeric value and question type
// feedbackResponseSchema.methods.getTextFromNumericValue = function(value, questionType) {
//   if (value === null || value === undefined) return "No Opinion";
  
//   switch (questionType) {
//     case "rating":
//       return this.getRatingText(value);
//     case "yes_no":
//       return this.getYesNoText(value);
//     case "mcq":
//     case "radio":
//     case "dropdown":
//       // Try different scales to see which makes more sense
//       if (value >= 0 && value <= 5) {
//         // Could be rating, satisfaction, or agreement
//         const ratingText = this.getRatingText(value);
//         const satisfactionText = this.getSatisfactionText(value);
//         const agreementText = this.getAgreementText(value);
        
//         // You could implement more complex logic here to determine which is most appropriate
//         return ratingText;
//       }
//       return value.toString();
//     default:
//       return value.toString();
//   }
// };

// // Method to calculate averages after submission, excluding "No Opinion" responses
// feedbackResponseSchema.methods.calculateAverages = function() {
//   const sectionMap = {};
//   let totalScore = 0;
//   let totalQuestions = 0;
//   let countedQuestions = 0;
  
//   // Group answers by section and calculate section averages
//   this.answers.forEach(answer => {
//     // Skip text-based questions
//     if (answer.questionType === "text" || answer.questionType === "date") {
//       return;
//     }
    
//     // Initialize section if it doesn't exist
//     if (!sectionMap[answer.sectionTitle]) {
//       sectionMap[answer.sectionTitle] = {
//         totalScore: 0,
//         count: 0,
//         countedQuestions: 0,
//         questions: []
//       };
//     }
    
//     // Count all questions of rateable types for total questions per section
//     sectionMap[answer.sectionTitle].count++;
//     totalQuestions++;
    
//     // Skip answers with null values (No Opinion)
//     if (answer.responseNumericValue === null || answer.responseNumericValue === undefined) {
//       return;
//     }
    
//     // Add to section totals only for valid numeric responses
//     sectionMap[answer.sectionTitle].totalScore += answer.responseNumericValue;
//     sectionMap[answer.sectionTitle].countedQuestions++;
//     sectionMap[answer.sectionTitle].questions.push({
//       id: answer.questionID,
//       value: answer.responseNumericValue
//     });
    
//     // Add to overall totals
//     totalScore += answer.responseNumericValue;
//     countedQuestions++;
//   });
  
//   // Calculate section averages
//   this.sectionAverages = Object.keys(sectionMap).map(section => {
//     const sectionData = sectionMap[section];
//     const avg = sectionData.countedQuestions > 0 ? 
//       sectionData.totalScore / sectionData.countedQuestions : 0;
      
//     return {
//       sectionTitle: section,
//       averageScore: parseFloat(avg.toFixed(2)),
//       questionCount: sectionData.count,
//       countedQuestions: sectionData.countedQuestions
//     };
//   });
  
//   // Calculate overall average
//   if (countedQuestions > 0) {
//     this.overallAverage = parseFloat((totalScore / countedQuestions).toFixed(2));
//   } else {
//     this.overallAverage = 0;
//   }
  
//   // Store total questions and counted questions for reference
//   this.totalQuestions = totalQuestions;
//   this.countedQuestions = countedQuestions;
  
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
  
//   // Set session label if not provided
//   if (!this.sessionLabel) {
//     const year = this.session.split(' ')[0];
//     const period = this.semesterType === "Odd" ? "Jul-Dec" : "Jan-Jun";
//     this.sessionLabel = `${year} ${period}`;
//   }
  
//   // Convert text responses to numeric values
//   this.answers.forEach(answer => {
//     // Store original response first
//     if (answer.responseText) {
//       answer.responseOriginalText = answer.responseText;
//     } else if (answer.responseOptions && answer.responseOptions.length > 0) {
//       answer.responseOriginalText = answer.responseOptions.join(', ');
//     } else if (answer.responseRating !== null && answer.responseRating !== undefined) {
//       answer.responseOriginalText = this.getRatingText(answer.responseRating);
//     }
    
//     // Now convert to numeric value based on question type
//     switch (answer.questionType) {
//       case "rating":
//         if (answer.responseRating !== null && answer.responseRating !== undefined) {
//           answer.responseNumericValue = answer.responseRating;
//         } else if (answer.responseText) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, "rating");
//         }
//         break;
        
//       case "yes_no":
//         if (answer.responseText) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, "yes_no");
//         } else if (answer.responseOptions && answer.responseOptions.length > 0) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseOptions[0], "yes_no");
//         }
//         break;
        
//       case "mcq":
//       case "radio":
//       case "dropdown":
//         if (answer.responseOptions && answer.responseOptions.length > 0) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseOptions[0], answer.questionType);
//         } else if (answer.responseText) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, answer.questionType);
//         }
//         break;
        
//       case "grid":
//         if (answer.responseText) {
//           answer.responseNumericValue = this.convertResponseToNumeric(answer.responseText, "grid");
//         }
//         break;
        
//       case "text":
//         // For text responses, we don't typically assign numeric values
//         break;
        
//       case "date":
//         // For date responses, we don't typically assign numeric values
//         break;
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
//     semesterType: Joi.string().valid("Odd", "Even").required(),
//     sessionLabel: Joi.string().allow(null, ''),
//     academicType: Joi.string().valid("Theory", "Practical").allow(null),
//     studentID: Joi.string().hex().length(24).required(),
//     facultyID: Joi.string().hex().length(24).allow(null),
//     section: Joi.string().required().trim(),
//     semester: Joi.string().required().trim(),
//     subject: Joi.string().allow(null, ''),
//     commonSemester: Joi.string().allow(null, ''),
//     commonSection: Joi.string().allow(null, ''),
//     answers: Joi.array().items(
//       Joi.object({
//         questionID: Joi.string().hex().length(24).required(),
//         questionText: Joi.string().required().trim(),
//         sectionTitle: Joi.string().required().trim(),
//         questionType: Joi.string().valid("rating", "yes_no", "mcq", "text", "grid", "dropdown", "date", "radio").required(),
//         responseText: Joi.string().allow('', null),
//         responseOptions: Joi.array().items(Joi.string()).allow(null),
//         responseRating: Joi.number().min(0).max(5).allow(null),
//         responseDate: Joi.date().allow(null),
//         responseNumericValue: Joi.number().allow(null),
//         responseOriginalText: Joi.string().allow('', null)
//       })
//     ).required(),
//     sectionAverages: Joi.array().items(
//       Joi.object({
//         sectionTitle: Joi.string().required(),
//         averageScore: Joi.number(),
//         questionCount: Joi.number(),
//         countedQuestions: Joi.number()
//       })
//     ).optional(),
//     overallAverage: Joi.number().optional(),
//     totalQuestions: Joi.number().optional(),
//     countedQuestions: Joi.number().optional(),
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
    averageScore: { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 }, // Total questions in section
    countedQuestions: { type: Number, default: 0 } // Questions actually counted (excluding "No Opinion")
  }],
  // Overall average score for the entire feedback
  overallAverage: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  countedQuestions: { type: Number, default: 0 }, // Questions actually counted for overall average
  status: { type: String, default: "submitted", enum: ["submitted", "pending"] },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Helper method to convert text responses to numeric values
feedbackResponseSchema.methods.convertResponseToNumeric = function(responseText, questionType) {
  if (!responseText && responseText !== 0) {
    return null;
  }
  
  // If responseText is already a number, return it directly
  if (!isNaN(responseText) && responseText !== '') {
    return Number(responseText);
  }
  
  // For scale: Poor, Average, Good, Very Good, Excellent, No Opinion
  const ratingMap = {
    "Poor": 1,
    "Average": 2,
    "Good": 3,
    "Very Good": 4,
    "Excellent": 5,
    "No Opinion": null
  };

  // For Yes/No: No, Yes, No Opinion
  const yesNoMap = {
    "No": 0,
    "Yes": 5,
    "No Opinion": null
  };

  // For weight scale: Just right, Too light, Too Heavy, No Opinion
  const weightMap = {
    "Just right": 2,
    "Too light": 1,
    "Too Heavy": 3,
    "No Opinion": null
  };

  // For satisfaction scale: Very Good, Good, Fair, Satisfactory, Unsatisfied
  const satisfactionMap = {
    "Very Good": 5,
    "Good": 4,
    "Fair": 3,
    "Satisfactory": 2,
    "Unsatisfied": 1,
    "No Opinion": null
  };
  
  // For agreement scale: Strongly Agree, Agree, Neutral, Disagree, Strongly Disagree
  const agreementMap = {
    "Strongly Agree": 5,
    "Agree": 4,
    "Neutral": 3,
    "Disagree": 2,
    "Strongly Disagree": 1,
    "No Opinion": null
  };
  
  // For frequency scale: Always, Frequently, Sometimes, Rarely, Never
  const frequencyMap = {
    "Always": 5,
    "Frequently": 4,
    "Sometimes": 3,
    "Rarely": 2,
    "Never": 1,
    "No Opinion": null
  };

  // Handle different question types
  switch (questionType) {
    case "rating":
      return ratingMap[responseText] !== undefined ? ratingMap[responseText] : Number(responseText) || null;
      
    case "yes_no":
      return yesNoMap[responseText] !== undefined ? yesNoMap[responseText] : null;
      
    case "mcq":
    case "radio":
    case "dropdown":
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
      break;
      
    case "grid":
      // Handle new grid response format
      try {
        // Check if responseText is a JSON string
        if (typeof responseText === 'string' && (responseText.startsWith('{') || responseText.startsWith('['))) {
          const gridData = JSON.parse(responseText);
          
          // If parsed data has numeric values directly stored
          if (Object.values(gridData).some(v => v && v.numericValue !== undefined)) {
            // Calculate average of all numeric values
            const numericValues = Object.values(gridData)
              .filter(v => v && v.numericValue !== undefined)
              .map(v => v.numericValue);
              
            if (numericValues.length > 0) {
              return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
            }
          }
          
          // Fall back to text-based parsing if needed
          const textValues = Object.values(gridData)
            .map(v => typeof v === 'object' ? v.value : v)
            .filter(v => v !== undefined && v !== null);
            
          if (textValues.length > 0) {
            // Try to map text values to numbers using all maps
            const mappedValues = textValues.map(text => {
              for (const map of allMaps) {
                if (map[text] !== undefined) {
                  return map[text];
                }
              }
              
              // If no match in maps, try direct numeric parsing
              const numMatch = typeof text === 'string' ? text.match(/\d+/) : null;
              return numMatch ? Number(numMatch[0]) : null;
            }).filter(v => v !== null);
            
            if (mappedValues.length > 0) {
              return mappedValues.reduce((sum, val) => sum + val, 0) / mappedValues.length;
            }
          }
        }
      } catch (e) {
        console.error("Error parsing grid data:", e);
      }
      break;
  }
  
  // If no match found but looks like a number, try parsing it
  if (typeof responseText === 'string' && /^\d+(\.\d+)?$/.test(responseText)) {
    return Number(responseText);
  }
  
  // If no matches found and it's not a numeric value, return null
  return null;
};

// Helper method to get the text representation of a rating value
feedbackResponseSchema.methods.getRatingText = function(value) {
  const ratingTexts = ["Poor", "Average", "Good", "Very Good", "Excellent"];
  return (value >= 1 && value <= ratingTexts.length) ? ratingTexts[value-1] : "No Opinion";
};

// Helper method to get the text representation of a yes/no value
feedbackResponseSchema.methods.getYesNoText = function(value) {
  if (value === 5) return "Yes";
  if (value === 0) return "No";
  return "No Opinion";
};

// Helper method to get text representation of satisfaction value
feedbackResponseSchema.methods.getSatisfactionText = function(value) {
  const satisfactionTexts = ["Unsatisfied", "Satisfactory", "Fair", "Good", "Very Good"];
  return (value >= 1 && value <= satisfactionTexts.length) ? satisfactionTexts[value-1] : "No Opinion";
};

// Helper method to get text representation of agreement value
feedbackResponseSchema.methods.getAgreementText = function(value) {
  const agreementTexts = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
  return (value >= 1 && value <= agreementTexts.length) ? agreementTexts[value-1] : "No Opinion";
};

// Helper method to get most appropriate text based on numeric value and question type
feedbackResponseSchema.methods.getTextFromNumericValue = function(value, questionType) {
  if (value === null || value === undefined) return "No Opinion";
  
  switch (questionType) {
    case "rating":
      return this.getRatingText(value);
    case "yes_no":
      return this.getYesNoText(value);
    case "mcq":
    case "radio":
    case "dropdown":
      // Try different scales to see which makes more sense
      if (value >= 0 && value <= 5) {
        // Could be rating, satisfaction, or agreement
        const ratingText = this.getRatingText(value);
        return ratingText;
      }
      return value.toString();
    default:
      return value.toString();
  }
};

// Method to calculate averages after submission, excluding "No Opinion" responses
feedbackResponseSchema.methods.calculateAverages = function() {
  console.log("Starting to calculate averages...");
  
  const sectionMap = {};
  let totalScore = 0;
  let totalQuestions = 0;
  let countedQuestions = 0;
  
  // Group answers by section and calculate section averages
  this.answers.forEach(answer => {
    console.log(`Processing answer for ${answer.questionText} (${answer.questionType}): Value = ${answer.responseNumericValue}`);
    
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
  
  // Log section data before finalizing
  console.log("Section data before finalization:", JSON.stringify(sectionMap, null, 2));
  
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
  if (countedQuestions > 0) {
    this.overallAverage = parseFloat((totalScore / countedQuestions).toFixed(2));
  } else {
    this.overallAverage = 0;
  }
  
  // Store total questions and counted questions for reference
  this.totalQuestions = totalQuestions;
  this.countedQuestions = countedQuestions;
  
  console.log("Final section averages:", JSON.stringify(this.sectionAverages, null, 2));
  console.log(`Overall average: ${this.overallAverage} (${countedQuestions}/${totalQuestions} questions counted)`);
  
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
  console.log(`Processing feedback response for form: ${this.formTitle}`);
  
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
    console.log(`Processing question: ${answer.questionText}, type: ${answer.questionType}`);
    console.log(`Original response: ${answer.responseText}`);
    
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
          console.log(`Grid converted value: ${answer.responseNumericValue}`);
        }
        break;
        
      case "text":
        // For text responses, we don't typically assign numeric values
        break;
        
      case "date":
        // For date responses, we don't typically assign numeric values
        break;
    }
    
    console.log(`Final numeric value for ${answer.questionText}: ${answer.responseNumericValue}`);
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
module.exports = { FeedbackResponse, validateFeedbackResponse };