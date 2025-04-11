// const mongoose = require("mongoose");
// const Joi = require("joi");
// // Schema for Feedback Form
// const feedbackFormSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   formType: {
//     type: String,
//     required: true,
//     enum: ["Academic", "Institutional", "Training"]
//   },
//   facultyAssigned: [{
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "Faculty"
//   }],
//   subjects: [{
//     type: String,
//     trim: true
//   }],
//   sectionsAssigned: [{
//     type: String
//   }], // Example: ["CSE-A", "CSE-B"]
//   semesters: [{ 
//     type: Number,  // ✅ Changed from String to Number
//     required: true
//   }],
//   deadline: {
//     type: Date,
//     required: true
//   },
//   createdBy: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   // Dynamic sections for organizing questions
//   sections: [{
//     title: { 
//       type: String, 
//       required: true, 
//       trim: true 
//     },
//     description: { 
//       type: String, 
//       trim: true 
//     },
//     questions: [{
//       questionText: { 
//         type: String, 
//         required: true 
//       },
//       questionType: { 
//         type: String, 
//         required: true, 
//         enum: ["rating", "yes_no", "mcq", "text", "grid", "dropdown", "date"] 
//       },
//       options: [{ 
//         type: String 
//       }], // For MCQ, Rating, Dropdown
//       gridOptions: { // For grid-type questions
//         rows: [{ type: String, required: true }],
//         columns: [{ type: String, required: true }]
//       },
//       required: { 
//         type: Boolean, 
//         default: true 
//       }
//     }]
//   }],
//   responses: [{ 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "FeedbackResponse" 
//   }],
//   status: { 
//     type: String, 
//     default: "active", 
//     enum: ["active", "closed"] 
//   }
// }, { timestamps: true });
// // Joi Validation for Feedback Form
// const validateFeedbackForm = (data) => {
//   const schema = Joi.object({
//     _id: Joi.string().hex().length(24).optional(),
//     title: Joi.string().required().trim(),
//     formType: Joi.string().valid("Academic", "Institutional", "Training").required(),
//     facultyAssigned: Joi.array().items(Joi.string().hex().length(24)).optional(),
//     subjects: Joi.array().items(Joi.string()).optional(),
//     sectionsAssigned: Joi.array().items(Joi.string()).optional(),
//     semesters: Joi.array().items(Joi.number().integer().min(1)).required(), // ✅ Changed to number validation
//     deadline: Joi.date().required(),
//     createdBy: Joi.string().hex().length(24).required(),
//     sections: Joi.array().items(
//       Joi.object({
//         title: Joi.string().required().trim(),
//         description: Joi.string().trim().optional(),
//         questions: Joi.array().items(
//           Joi.object({
//             questionText: Joi.string().required(),
//             questionType: Joi.string().valid("rating", "yes_no", "mcq", "text", "grid", "dropdown", "date").required(),
//             options: Joi.when('questionType', {
//               is: Joi.string().valid("mcq", "rating", "dropdown"),
//               then: Joi.array().items(Joi.string()).min(1).required(),
//               otherwise: Joi.array().items(Joi.string()).optional()
//             }),
//             gridOptions: Joi.when('questionType', {
//               is: 'grid',
//               then: Joi.object({
//                 rows: Joi.array().items(Joi.string()).min(1).required(),
//                 columns: Joi.array().items(Joi.string()).min(1).required()
//               }).required(),
//               otherwise: Joi.object().optional()
//             }),
//             required: Joi.boolean().default(true)
//           })
//         ).required()
//       })
//     ).required(),
//     status: Joi.string().valid("active", "closed").default("active"),
//     responses: Joi.array().items(Joi.string().hex().length(24)).optional()
//   });  
//   return schema.validate(data);
// };
// const FeedbackForm = mongoose.model("FeedbackForm", feedbackFormSchema);
// module.exports = { FeedbackForm, validateFeedbackForm };

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
  // New field to track if form was created from a template
  createdFromTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FormTemplate",
    default: null
  },
  // For Academic form type
  academicType: {
    type: String,
    enum: ["Theory", "Practical"],
    required: function() {
      return this.formType === "Academic";
    }
  },
  facultyAssigned: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Faculty"
  }],
  subjects: [{
    type: String,
    trim: true
  }],
  sectionsAssigned: [{
    type: String
  }], // Example: ["CSE-A", "CSE-B"]
  semesters: [{ 
    type: Number,
    required: true
  }],
  deadline: {
    type: Date,
    required: true
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  },
  // Dynamic sections for organizing questions
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
      }], // For MCQ, Rating, Dropdown
      gridOptions: { // For grid-type questions
        rows: [{ type: String, required: true }],
        columns: [{ type: String, required: true }]
      },
      required: { 
        type: Boolean, 
        default: true 
      }
    }]
  }],
  responses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "FeedbackResponse" 
  }],
  status: { 
    type: String, 
    default: "active", 
    enum: ["active", "closed"] 
  }
}, { timestamps: true });

// Joi Validation for Feedback Form
const validateFeedbackForm = (data) => {
  const schema = Joi.object({
    _id: Joi.string().hex().length(24).optional(),
    title: Joi.string().required().trim(),
    formType: Joi.string().valid("Academic", "Institutional", "Training").required(),
    createdFromTemplate: Joi.string().hex().length(24).optional(),
    academicType: Joi.when('formType', {
      is: "Academic",
      then: Joi.string().valid("Theory", "Practical").required(),
      otherwise: Joi.optional()
    }),
    facultyAssigned: Joi.array().items(Joi.string().hex().length(24)).optional(),
    subjects: Joi.array().items(Joi.string()).optional(),
    sectionsAssigned: Joi.array().items(Joi.string()).optional(),
    semesters: Joi.array().items(Joi.number().integer().min(1)).required(),
    deadline: Joi.date().required(),
    createdBy: Joi.string().hex().length(24).required(),
    sections: Joi.array().items(
      Joi.object({
        title: Joi.string().required().trim(),
        description: Joi.string().trim().optional(),
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
    ).required(),
    status: Joi.string().valid("active", "closed").default("active"),
    responses: Joi.array().items(Joi.string().hex().length(24)).optional()
  });  
  return schema.validate(data);
};

// Function to apply template to a form
feedbackFormSchema.statics.applyTemplate = async function(templateId, formData) {
  try {
    // Import the FormTemplate model
    const { FormTemplate } = require('./formTemplate.model');
    
    // Find the template
    const template = await FormTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Copy template sections to the form
    formData.sections = JSON.parse(JSON.stringify(template.sections));
    formData.createdFromTemplate = template._id;
    
    // If it's an academic form, copy the academic type too
    if (template.formType === "Academic" && template.academicType) {
      formData.academicType = template.academicType;
    }
    
    return formData;
  } catch (error) {
    throw new Error(`Error applying template: ${error.message}`);
  }
};

// Method to get available templates by form type
feedbackFormSchema.statics.getTemplatesByType = async function(formType) {
  try {
    // Import the FormTemplate model
    const { FormTemplate } = require('./formTemplate.model');
    
    // Find templates by form type
    const templates = await FormTemplate.find({ formType });
    return templates;
  } catch (error) {
    throw new Error(`Error fetching templates: ${error.message}`);
  }
};

const FeedbackForm = mongoose.model("FeedbackForm", feedbackFormSchema);

module.exports = { FeedbackForm, validateFeedbackForm };