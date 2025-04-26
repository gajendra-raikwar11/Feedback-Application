const mongoose = require("mongoose");
const Joi = require("joi");

// Mongoose Schema for FormTemplate
const formTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  formType: {
    type: String,
    required: true,
    enum: ["Academic", "Institutional", "Training"]
  },
  academicType: {
    type: String,
    enum: ["Theory", "Practical"],
    required: function () {
      return this.formType === "Academic";
    }
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  },
  sections: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    questions: [{
      questionText: {
        type: String,
        required: true
      },
      questionType: {
        type: String,
        required: true,
        enum: ["rating", "yes_no", "mcq", "text", "grid", "dropdown", "date"]
      },
      options: [{
        type: String
      }],
      gridOptions: {
        rows: [{ type: String }],
        columns: [{ type: String }]
      },
      required: {
        type: Boolean,
        default: true
      }
    }]
  }]
}, { timestamps: true });

// Mongoose Model
const FormTemplate = mongoose.model("FormTemplate", formTemplateSchema);

// Joi Validation Function
const validateFormTemplate = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    formType: Joi.string().valid("Academic", "Institutional", "Training").required(),
    academicType: Joi.when('formType', {
      is: "Academic",
      then: Joi.string().valid("Theory", "Practical").required(),
      otherwise: Joi.forbidden()
    }),
    createdBy: Joi.string().hex().length(24).required(),
    sections: Joi.array().items(
      Joi.object({
        title: Joi.string().required().trim(),
        description: Joi.string().optional().trim(),
        questions: Joi.array().items(
          Joi.object({
            questionText: Joi.string().required(),
            questionType: Joi.string().valid("rating", "yes_no", "mcq", "text", "grid", "dropdown", "date").required(),
            options: Joi.when('questionType', {
              is: Joi.string().valid("mcq", "rating", "dropdown"),
              then: Joi.array().items(Joi.string()).min(1).required(),
              otherwise: Joi.array().items(Joi.string()).optional()
            }),
            gridOptions: Joi.when('questionType', {
              is: 'grid',
              then: Joi.object({
                rows: Joi.array().items(Joi.string()).min(1).required(),
                columns: Joi.array().items(Joi.string()).min(1).required()
              }).required(),
              otherwise: Joi.object().optional()
            }),
            required: Joi.boolean().default(true)
          })
        ).required()
      })
    ).required()
  });

  return schema.validate(data);
};

// Exporting both
module.exports = {
  FormTemplate,
  validateFormTemplate
};