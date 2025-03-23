const mongoose = require("mongoose");
const Joi = require("joi");

// Schema for Feedback Form
const feedbackFormSchema = new mongoose.Schema({
  title: {
     type: String,
    required: true,
    trim: true
  },
  formType: {
    type: String,
    required: true,
    enum: ["Academic", "Institutional", "Training"]
  },
  facultyAssigned:[{
     type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true 
    }],
  sectionsAssigned:[{
    type: String, required: true
  }], // Example: ["CSE-A", "CSE-B"]
  deadline: {
    type: Date,
    required: true
  },
  semester: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: String,
    trim: true
  },
  questions: [
    {
      questionText: { type: String, required: true },
      questionType: { 
        type: String, 
        required: true, 
        enum: ["rating", "yes_no", "mcq", "text", "grid", "dropdown", "date"] 
      },
      options: [{
        type: String 
      }], // For MCQ, Rating, Dropdown
      gridOptions:{ // For grid-type questions
        rows: [{ type: String }],
        columns: [{ type: String }]
      },
      required: { type: Boolean, default: true }
    }
  ],
  responses: [{ type: mongoose.Schema.Types.ObjectId, ref: "FeedbackResponse" }],
  status: { type: String, default: "active", enum: ["active", "closed"] }
}, { timestamps: true });

// Joi Validation for Feedback Form
const validateFeedbackForm = (data) => {
  const schema = Joi.object({
    title: Joi.string().required().trim(),
    formType: Joi.string().valid("Academic", "Institutional", "Training").required(),
    facultyAssigned: Joi.array().items(Joi.string().hex().length(24)).required(),
    sectionsAssigned: Joi.array().items(Joi.string()).required(),
    deadline: Joi.date().required(),
    semester: Joi.string().required(),
    createdBy: Joi.string(),
    questions: Joi.array().items(
      Joi.object({
        questionText: Joi.string().required(),
        questionType: Joi.string().valid("rating", "yes_no", "mcq", "text", "grid", "dropdown", "date").required(),
        options: Joi.array().items(Joi.string()).optional(),
        gridOptions: Joi.object({
          rows: Joi.array().items(Joi.string()).optional(),
          columns: Joi.array().items(Joi.string()).optional()
        }).optional(),
        required: Joi.boolean().default(true)
      })
    ).required(),
    status: Joi.string().valid("active", "closed").default("active")
  });

  return schema.validate(data);
};

const FeedbackForm = mongoose.model("FeedbackForm", feedbackFormSchema);
module.exports = { FeedbackForm, validateFeedbackForm };