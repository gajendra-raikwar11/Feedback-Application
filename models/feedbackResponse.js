// const mongoose = require("mongoose");
// const Joi = require("joi");

// // Schema for Feedback Response
// const feedbackResponseSchema = new mongoose.Schema({
//   formID: {
//      type: mongoose.Schema.Types.ObjectId,
//      ref: "FeedbackForm", required: true
//      },
//   studentID:
//     {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Student", required: true 
//     },
//   facultyID:{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Faculty", required: true
//     },
//   section:{
//     type: String,
//     required: true
//     },
//   answers: [
//     {
//       questionID: { type: mongoose.Schema.Types.ObjectId, required: true },
//       responseText: { type: String }, // For text-based answers
//       responseOptions: [{ type: String }], // For multiple-choice / grid answers
//       responseRating: { type: Number, min: 1, max: 5 } // For rating questions
//     }
//   ],
//   timestamp: { type: Date, default: Date.now }
// });

// // In your validation file (e.g., validation.js)
// function validateFeedbackResponse(response) {
//   const schema = Joi.object({
//     formID: Joi.string().required(),
//     studentID: Joi.string().required(),
//     facultyID: Joi.string().required(),
//     section: Joi.string().required(),
//     answers: Joi.array().items(
//       Joi.object({
//         questionID: Joi.string().required(),
//         responseText: Joi.string().allow('', null),
//         responseOptions: Joi.array().items(Joi.string()).allow(null),
//         responseRating: Joi.number().min(0).max(5).allow(null)
//       }).unknown(true) // Allow other properties that may be added
//     )
//   });
  
//   return schema.validate(response);
// }

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
  studentID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  facultyID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true
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
  answers: [
    {
      questionID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Question",
        required: true 
      },
      responseText: { type: String, trim: true, default: null }, // For text-based answers
      responseOptions: [{ type: String }], // For multiple-choice, dropdown, grid
      responseRating: { type: Number, min: 1, max: 5, default: null } // For rating questions
    }
  ],
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, default: "submitted", enum: ["submitted", "pending"] }
}, { timestamps: true });

// Joi Validation for Feedback Response
const validateFeedbackResponse = (data) => {
  const schema = Joi.object({
    formID: Joi.string().hex().length(24).required(),
    studentID: Joi.string().hex().length(24).required(),
    facultyID: Joi.string().hex().length(24).required(),
    section: Joi.string().required().trim(),
    semester: Joi.string().required().trim(),
    answers: Joi.array().items(
      Joi.object({
        questionID: Joi.string().hex().length(24).required(),
        responseText: Joi.string().allow('', null),
        responseOptions: Joi.array().items(Joi.string()).allow(null),
        responseRating: Joi.number().min(1).max(5).allow(null)
      })
    ).required(),
    status: Joi.string().valid("submitted", "pending").default("submitted")
  });

  return schema.validate(data);
};

const FeedbackResponse = mongoose.model("FeedbackResponse", feedbackResponseSchema);
module.exports = { FeedbackResponse, validateFeedbackResponse };
