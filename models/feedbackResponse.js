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
  commonSemester: {
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
      responseRating: { type: Number, min: 1, max: 5, default: null },
      responseDate: { type: Date, default: null },
      // New field to store numeric value for any response type
      responseNumericValue: { type: Number, default: null },
      // Optional field to store the original text response for reference
      responseOriginalText: { type: String, trim: true, default: null }
    }
  ],
  // New field to store average scores for each section
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
feedbackResponseSchema.methods.convertResponseToNumeric = function(responseText, questionType) {
  // For scale: Poor, Average, Good, Very Good, Excellent, No Opinion
  const scaleMap1 = {
    "Poor": 1,
    "Average": 2,
    "Good": 3,
    "Very Good": 4,
    "Excellent": 5,
    "No Opinion": 0
  };
  
  // For Yes/No: No, Yes, No Opinion
  const yesNoMap = {
    "No": 0,
    "Yes": 1,
    "No Opinion": null
  };
  
  // For weight scale: Just right, Too light, Too Heavy, No Opinion
  const weightMap = {
    "Just right": 2,
    "Too light": 1,
    "Too Heavy": 3,
    "No Opinion": 0
  };
  
  // For satisfaction scale: Very Good, Good, Fair, Satisfactory, Unsatisfied
  const satisfactionMap = {
    "Very Good": 5,
    "Good": 4,
    "Fair": 3,
    "Satisfactory": 2,
    "Unsatisfied": 1
  };
  
  if (questionType === "rating") {
    // Rating is already numeric (1-5)
    return responseText ? Number(responseText) : null;
  } else if (questionType === "yes_no") {
    return yesNoMap[responseText] ?? null;
  } else if (questionType === "mcq" || questionType === "radio") {
    // Try to match with any of the scales
    if (scaleMap1[responseText] !== undefined) {
      return scaleMap1[responseText];
    } else if (yesNoMap[responseText] !== undefined) {
      return yesNoMap[responseText];
    } else if (weightMap[responseText] !== undefined) {
      return weightMap[responseText];
    } else if (satisfactionMap[responseText] !== undefined) {
      return satisfactionMap[responseText];
    }
  }
  
  return null; // Default if no match found
};

// Method to calculate averages after submission
feedbackResponseSchema.methods.calculateAverages = function() {
  const sectionMap = {};
  let totalScore = 0;
  let totalQuestions = 0;
  
  // Group answers by section and calculate section averages
  this.answers.forEach(answer => {
    if (answer.responseNumericValue !== null) {
      if (!sectionMap[answer.sectionTitle]) {
        sectionMap[answer.sectionTitle] = {
          totalScore: 0,
          count: 0
        };
      }
      
      sectionMap[answer.sectionTitle].totalScore += answer.responseNumericValue;
      sectionMap[answer.sectionTitle].count++;
      
      totalScore += answer.responseNumericValue;
      totalQuestions++;
    }
  });
  
  // Calculate section averages
  this.sectionAverages = Object.keys(sectionMap).map(section => {
    const avg = sectionMap[section].totalScore / sectionMap[section].count;
    return {
      sectionTitle: section,
      averageScore: parseFloat(avg.toFixed(2))
    };
  });
  
  // Calculate overall average
  if (totalQuestions > 0) {
    this.overallAverage = parseFloat((totalScore / totalQuestions).toFixed(2));
  }
  
  return this;
};

// Middleware to convert responses and calculate averages before saving
feedbackResponseSchema.pre('save', function(next) {
  // Convert text responses to numeric values if not already done
  this.answers.forEach(answer => {
    if (answer.responseNumericValue === null && answer.responseOptions && answer.responseOptions.length > 0) {
      // Store original response text
      answer.responseOriginalText = answer.responseOptions.join(', ');
      // Convert to numeric value
      const responseText = answer.responseOptions[0]; // Assuming single selection
      answer.responseNumericValue = this.convertResponseToNumeric(responseText, answer.questionType);
    } else if (answer.questionType === "rating" && answer.responseRating !== null) {
      answer.responseNumericValue = answer.responseRating;
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
    studentID: Joi.string().hex().length(24).required(),
    facultyID: Joi.string().hex().length(24).allow(null),
    section: Joi.string().required().trim(),
    semester: Joi.string().required().trim(),
    commonSemester: Joi.string().allow(null, ''),
    answers: Joi.array().items(
      Joi.object({
        questionID: Joi.string().hex().length(24).required(),
        questionText: Joi.string().required().trim(),
        sectionTitle: Joi.string().required().trim(),
        questionType: Joi.string().valid("rating", "yes_no", "mcq", "text", "grid", "dropdown", "date", "radio").required(),
        responseText: Joi.string().allow('', null),
        responseOptions: Joi.array().items(Joi.string()).allow(null),
        responseRating: Joi.number().min(1).max(5).allow(null),
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
    ),
    overallAverage: Joi.number(),
    status: Joi.string().valid("submitted", "pending").default("submitted")
  });

  return schema.validate(data);
};

// Create model
const FeedbackResponse = mongoose.model("FeedbackResponse", feedbackResponseSchema);

module.exports = { FeedbackResponse, validateFeedbackResponse };