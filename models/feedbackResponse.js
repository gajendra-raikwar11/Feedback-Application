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
      }, // सेक्शन टाइटल जोड़ा गया
      questionType: {
        type: String,
        enum: ["rating", "yes_no", "mcq", "text", "grid", "dropdown", "date","radio"],
        required: true
      }, // प्रश्न का प्रकार
      responseText: { type: String, trim: true, default: null },
      responseOptions: [{ type: String }],
      responseRating: { type: Number, min: 1, max: 5, default: null },
      responseDate: { type: Date, default: null } // यदि तारीख का प्रश्न हो तो
    }
  ],
  status: { type: String, default: "submitted", enum: ["submitted", "pending"] },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

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
    commonSemester: Joi.string().allow(null),
    answers: Joi.array().items(
      Joi.object({
        questionID: Joi.string().hex().length(24).required(),
        questionText: Joi.string().required().trim(),
        sectionTitle: Joi.string().required().trim(),
        questionType: Joi.string().valid("rating", "yes_no", "mcq", "text", "grid", "dropdown", "date","radio").required(),
        responseText: Joi.string().allow('', null),
        responseOptions: Joi.array().items(Joi.string()).allow(null),
        responseRating: Joi.number().min(1).max(5).allow(null),
        responseDate: Joi.date().allow(null)
      })
    ).required(),
    status: Joi.string().valid("submitted", "pending").default("submitted")
  });

  return schema.validate(data);
};

const FeedbackResponse = mongoose.model("FeedbackResponse", feedbackResponseSchema);
module.exports = { FeedbackResponse, validateFeedbackResponse };