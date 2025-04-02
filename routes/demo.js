// // form builder
// <!DOCTYPE html>
// <html lang="en">

// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Form Builder</title>
//     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
//     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
//     <style>
//         :root {
//             --primary-color: #2c3e50;
//             --primary-light: #eaecef;
//             --secondary-color: #6c757d;
//             --success-color: #27ae60;
//             --danger-color: #c0392b;
//             --light-bg: #f8f9fa;
//             --dark-text: #2c3e50;
//             --border-radius: 0.375rem;
//             --box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
//             --transition: all 0.25s ease;
//         }

//         body {
//             font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
//             color: var(--dark-text);
//             background-color: #f5f7fa;
//             line-height: 1.6;
//         }

//         .main-container {
//             padding: 1.5rem 0;
//         }

//         .page-title {
//             font-weight: 600;
//             color: var(--dark-text);
//             margin-bottom: 1.75rem;
//             position: relative;
//             padding-bottom: 0.75rem;
//             font-size: 1.75rem;
//         }

//         .page-title:after {
//             content: '';
//             position: absolute;
//             bottom: 0;
//             left: 0;
//             width: 60px;
//             height: 3px;
//             background-color: var(--primary-color);
//         }

//         .card {
//             border-radius: var(--border-radius);
//             border: none;
//             box-shadow: var(--box-shadow);
//             transition: var(--transition);
//             margin-bottom: 2rem;
//         }

//         .card-header {
//             background-color: var(--primary-color);
//             color: white;
//             border-bottom: none;
//             padding: 1.25rem 1.5rem;
//             border-top-left-radius: var(--border-radius);
//             border-top-right-radius: var(--border-radius);
//             font-weight: 500;
//         }

//         .card-body {
//             padding: 1.75rem;
//         }

//         .form-section {
//             background-color: var(--light-bg);
//             padding: 1.75rem;
//             border-radius: var(--border-radius);
//             margin-bottom: 2rem;
//             border: 1px solid rgba(0, 0, 0, 0.1);
//         }

//         .form-section-title {
//             font-weight: 600;
//             color: var(--primary-color);
//             margin-bottom: 1.25rem;
//             display: flex;
//             align-items: center;
//             gap: 0.75rem;
//             font-size: 1.25rem;
//         }

//         .form-section-icon {
//             background-color: var(--primary-light);
//             color: var(--primary-color);
//             padding: 0.5rem;
//             border-radius: 50%;
//             display: inline-flex;
//             align-items: center;
//             justify-content: center;
//             width: 40px;
//             height: 40px;
//         }

//         .field-item {
//             padding: 1.25rem;
//             margin-bottom: 1.25rem;
//             background-color: #fff;
//             border-radius: var(--border-radius);
//             border: 1px solid #e0e5ec;
//             transition: var(--transition);
//             position: relative;
//             box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
//         }

//         .field-item:hover {
//             border-color: var(--primary-color);
//             box-shadow: 0 0 0 0.25rem rgba(44, 62, 80, 0.1);
//         }

//         .field-handle {
//             cursor: move;
//             color: var(--secondary-color);
//             padding: 0.5rem;
//         }

//         .field-options-container {
//             background-color: var(--light-bg);
//             padding: 1rem;
//             border-radius: var(--border-radius);
//             margin-top: 1rem;
//             border: 1px solid #e0e5ec;
//         }

//         .assigned-faculty {
//             display: inline-flex;
//             align-items: center;
//             margin: 0.375rem;
//             padding: 0.5rem 0.875rem;
//             background-color: var(--primary-light);
//             color: var(--primary-color);
//             border-radius: 2rem;
//             font-size: 0.875rem;
//             border: 1px solid rgba(44, 62, 80, 0.2);
//             transition: var(--transition);
//         }

//         .assigned-faculty:hover {
//             background-color: rgba(44, 62, 80, 0.1);
//         }

//         .remove-faculty {
//             background: none;
//             border: none;
//             color: var(--danger-color);
//             margin-left: 0.5rem;
//             padding: 0;
//             font-size: 0.75rem;
//         }

//         .btn-primary {
//             background-color: var(--primary-color);
//             border-color: var(--primary-color);
//             transition: var(--transition);
//         }

//         .btn-primary:hover {
//             background-color: #1e2b38;
//             border-color: #1e2b38;
//         }

//         .btn-outline-primary {
//             color: var(--primary-color);
//             border-color: var(--primary-color);
//         }

//         .btn-outline-primary:hover {
//             background-color: var(--primary-color);
//             border-color: var(--primary-color);
//         }

//         .form-control,
//         .form-select {
//             padding: 0.625rem 0.875rem;
//             border-radius: var(--border-radius);
//             border: 1px solid #d1d9e6;
//             transition: var(--transition);
//             font-size: 0.95rem;
//         }

//         .form-control:focus,
//         .form-select:focus {
//             border-color: var(--primary-color);
//             box-shadow: 0 0 0 0.25rem rgba(44, 62, 80, 0.25);
//         }

//         .form-label {
//             font-weight: 500;
//             margin-bottom: 0.5rem;
//             color: #495057;
//         }

//         .form-switch .form-check-input {
//             height: 1.25rem;
//             width: 2.5rem;
//         }

//         .form-switch .form-check-input:checked {
//             background-color: var(--primary-color);
//             border-color: var(--primary-color);
//         }

//         .empty-container {
//             padding: 2.5rem;
//             text-align: center;
//             color: var(--secondary-color);
//             border: 2px dashed #dee2e6;
//             border-radius: var(--border-radius);
//             background-color: rgba(222, 226, 230, 0.2);
//         }

//         .empty-container i {
//             font-size: 2rem;
//             margin-bottom: 1rem;
//             color: #adb5bd;
//         }

//         .empty-container p {
//             margin-bottom: 0;
//             font-size: 1rem;
//         }

//         .action-buttons {
//             display: flex;
//             justify-content: flex-end;
//             gap: 0.75rem;
//             margin-top: 2rem;
//         }

//         .action-buttons .btn {
//             padding: 0.625rem 1.75rem;
//             font-weight: 500;
//             min-width: 120px;
//         }

//         /* Modal styles */
//         .modal-content {
//             border: none;
//             border-radius: var(--border-radius);
//             box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
//         }

//         .modal-header {
//             background-color: var(--primary-color);
//             color: white;
//             border-bottom: none;
//             border-top-left-radius: var(--border-radius);
//             border-top-right-radius: var(--border-radius);
//         }

//         .modal-title {
//             font-weight: 500;
//         }

//         .modal-body {
//             padding: 1.75rem;
//         }

//         .modal-footer {
//             border-top: 1px solid #e9ecef;
//             padding: 1rem 1.75rem;
//         }

//         /* Toast styles */
//         .toast {
//             border: none;
//             border-radius: var(--border-radius);
//             box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
//         }

//         .toast-header {
//             border-bottom: none;
//             border-top-left-radius: var(--border-radius);
//             border-top-right-radius: var(--border-radius);
//         }

//         /* Assigned Section */
//         .assigned-section {
//             display: inline-flex;
//             align-items: center;
//             margin: 0.375rem;
//             padding: 0.5rem 0.875rem;
//             background-color: var(--primary-light);
//             color: var(--primary-color);
//             border-radius: 2rem;
//             font-size: 0.875rem;
//             border: 1px solid rgba(44, 62, 80, 0.2);
//             transition: var(--transition);
//         }

//         .assigned-section:hover {
//             background-color: rgba(44, 62, 80, 0.1);
//         }

//         .remove-section {
//             background: none;
//             border: none;
//             color: var(--danger-color);
//             margin-left: 0.5rem;
//             padding: 0;
//             font-size: 0.75rem;
//         }

//         /* Responsive adjustments */
//         @media (max-width: 991px) {
//             .card-body {
//                 padding: 1.5rem;
//             }

//             .form-section {
//                 padding: 1.5rem;
//             }
//         }

//         @media (max-width: 767px) {
//             .field-item .row [class*="col-"] {
//                 margin-bottom: 1rem;
//             }

//             .field-item .row [class*="col-"]:last-child {
//                 margin-bottom: 0;
//             }

//             .action-buttons {
//                 flex-direction: column;
//                 width: 100%;
//                 gap: 0.5rem;
//             }

//             .action-buttons .btn {
//                 width: 100%;
//             }

//             .card-body {
//                 padding: 1.25rem;
//             }

//             .form-section {
//                 padding: 1.25rem;
//             }

//             .page-title {
//                 font-size: 1.5rem;
//             }

//             .form-section-title {
//                 font-size: 1.125rem;
//             }
//         }

//         @media (max-width: 575px) {
//             .field-item {
//                 padding: 1rem;
//             }

//             .empty-container {
//                 padding: 2rem 1rem;
//             }

//             .field-options-container {
//                 padding: 0.875rem;
//             }
//         }
//     </style>
// </head>

// <body>
//     <%- include('partials/adminTopNavbar', { admin: adminData }) %>
//         <div class="container main-container flex">
//             <%- include('./partials/adminSideNavbar', { path: currentPath ,admin: adminData  }) %>

//                 <h2 class="page-title">Feedback Form Builder</h2>

//                 <div class="card">
//                     <div class="card-header d-flex justify-content-between align-items-center">
//                         <span>Create New Feedback Form</span>
//                     </div>
//                     <div class="card-body">
//                         <form id="createFormForm">
//                             <div class="row mb-4">
//                                 <div class="col-lg-6 mb-3 mb-lg-0">
//                                     <div class="mb-3">
//                                         <label for="formType" class="form-label">Form Type</label>
//                                         <!-- Changed to display the form type as text and hidden input -->
//                                         <input type="text" class="form-control" value="<%= formType %>" readonly>
//                                         <input type="hidden" id="formType" name="formType" value="<%= formType %>">
//                                     </div>

//                                     <div class="mb-3">
//                                         <label for="formTitle" class="form-label">Form Title</label>
//                                         <input type="text" class="form-control" id="formTitle" name="title" required
//                                             placeholder="Enter descriptive title">
//                                     </div>

//                                     <!-- Department Field -->

//                                 </div>

//                                 <div class="col-lg-6">
//                                     <div class="mb-3">
//                                         <label for="formDeadline" class="form-label">Submission Deadline</label>
//                                         <input type="date" class="form-control" id="formDeadline" name="deadline">
//                                         <small class="text-muted">Leave blank for no deadline</small>
//                                     </div>

//                                     <!-- Semester Field -->
//                                     <div class="mb-3">
//                                         <label for="semester" class="form-label">Semester</label>
//                                         <select class="form-select" id="semester" name="semester" required>
//                                             <option value="">-- Select Semester --</option>
//                                             <option value="Semester 1">Semester 1</option>
//                                             <option value="Semester 2">Semester 2</option>
//                                             <option value="Semester 3">Semester 3</option>
//                                             <option value="Semester 4">Semester 4</option>
//                                             <option value="Semester 5">Semester 5</option>
//                                             <option value="Semester 6">Semester 6</option>
//                                             <option value="Semester 7">Semester 7</option>
//                                             <option value="Semester 8">Semester 8</option>
//                                         </select>
//                                     </div>

//                                     <!-- hide created by name -->
//                                     <input type="hidden" id="createdBy" name="createdBy"
//                                         value="<%= adminData ? adminData.name : '' %>">

//                                     <div class="mb-3">
//                                         <label class="form-label">Form Status</label>
//                                         <div class="form-check form-switch">
//                                             <input class="form-check-input" type="checkbox" id="formStatus"
//                                                 name="status" value="active" checked>
//                                             <label class="form-check-label" for="formStatus">
//                                                 <span class="status-text">Active</span>
//                                             </label>
//                                         </div>
//                                         <small class="text-muted">Active forms are immediately available for
//                                             submission</small>
//                                     </div>
//                                 </div>
//                             </div>

//                             <!-- Faculty Assignment Section -->
//                             <div class="form-section">
//                                 <div class="form-section-title">
//                                     <span class="form-section-icon"><i class="fas fa-user-tie"></i></span>
//                                     Faculty Assignment
//                                 </div>

//                                 <div class="row align-items-end">
//                                     <div class="col-md-8 mb-3 mb-md-0">
//                                         <label for="facultySelect" class="form-label">Select Faculty Members</label>
//                                         <select class="form-select" id="facultySelect">
//                                             <option value="">-- Select Faculty --</option>
//                                             <% faculties.forEach(function(faculty) { %>
//                                                 <option value="<%= faculty._id %>">
//                                                     <%= faculty.name %> (<%= faculty.department %>)
//                                                 </option>
//                                                 <% }); %>
//                                         </select>
//                                     </div>
//                                     <div class="col-md-4">
//                                         <button type="button" class="btn btn-outline-primary w-100" id="addFacultyBtn">
//                                             <i class="fas fa-user-plus me-2"></i> Assign Faculty
//                                         </button>
//                                     </div>
//                                 </div>

//                                 <div id="assignedFaculties" class="mt-3">
//                                     <div class="empty-container" id="emptyFacultiesMessage">
//                                         <i class="fas fa-user-check"></i>
//                                         <p>No faculty members have been assigned to this form yet.</p>
//                                     </div>
//                                     <!-- Assigned faculties will appear here -->
//                                 </div>
//                             </div>

//                             <!-- Section Assignment -->
//                             <div class="form-section">
//                                 <div class="form-section-title">
//                                     <span class="form-section-icon"><i class="fas fa-layer-group"></i></span>
//                                     Section Assignment
//                                 </div>

//                                 <div class="row align-items-end">
//                                     <div class="col-md-8 mb-3 mb-md-0">
//                                         <label for="sectionSelect" class="form-label">Select Sections</label>
//                                         <select class="form-select" id="sectionSelect">
//                                             <option value="">-- Select Section --</option>
//                                             <% sectionCategories.forEach(function(section) { %>
//                                                 <option value="<%= section %>">
//                                                     <%= section %>
//                                                 </option>
//                                                 <% }); %>
//                                         </select>
//                                     </div>
//                                     <div class="col-md-4">
//                                         <button type="button" class="btn btn-outline-primary w-100" id="addSectionBtn">
//                                             <i class="fas fa-plus me-2"></i> Assign Section
//                                         </button>
//                                     </div>
//                                 </div>

//                                 <div id="assignedSections" class="mt-3">
//                                     <div class="empty-container" id="emptySectionsMessage">
//                                         <i class="fas fa-layer-group"></i>
//                                         <p>No sections have been assigned to this form yet.</p>
//                                     </div>
//                                     <!-- Assigned sections will appear here -->
//                                 </div>
//                             </div>

//                             <!-- Questions Builder -->
//                             <div class="form-section">
//                                 <div class="form-section-title">
//                                     <span class="form-section-icon"><i class="fas fa-list-alt"></i></span>
//                                     Questions Configuration
//                                 </div>

//                                 <div id="questionsContainer">
//                                     <div class="empty-container" id="emptyQuestionsMessage">
//                                         <i class="fas fa-clipboard-list"></i>
//                                         <p>No questions have been added yet. Please use the button below to add
//                                             questions.</p>
//                                     </div>
//                                     <!-- Questions will be added here -->
//                                 </div>

//                                 <div class="mt-3">
//                                     <button type="button" class="btn btn-outline-primary" id="addQuestionBtn">
//                                         <i class="fas fa-plus me-2"></i> Add New Question
//                                     </button>
//                                 </div>
//                             </div>

//                             <div class="action-buttons">
//                                 <button type="button" class="btn btn-outline-secondary" id="previewBtn">
//                                     <i class="fas fa-eye me-2"></i> Preview Form
//                                 </button>
//                                 <button type="submit" class="btn btn-primary">
//                                     <i class="fas fa-save me-2"></i> Create Form
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//         </div>

//         <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
//         <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>

//     <script>
//         $(document).ready(function () {
//     // Toggle status text
//     $('#formStatus').change(function () {
//         $('.status-text').text($(this).is(':checked') ? 'Active' : 'Inactive');
//         $(this).val($(this).is(':checked') ? 'active' : 'closed');
//     });

//     // Add faculty member
//     $('#addFacultyBtn').click(function () {
//         const facultySelect = $('#facultySelect');
//         const facultyId = facultySelect.val();

//         if (facultyId) {
//             const facultyName = facultySelect.find('option:selected').text();
//             const facultyHtml = `
//             <div class="assigned-faculty" data-id="${facultyId}">
//                 <i class="fas fa-user-tie me-1"></i>
//                 ${facultyName}
//                 <button type="button" class="btn btn-sm text-danger remove-faculty">
//                     <i class="fas fa-times"></i>
//                 </button>
//                 <input type="hidden" name="facultyAssigned[]" value="${facultyId}">
//             </div>
//             `;

//             $('#assignedFaculties').append(facultyHtml);
//             $('#emptyFacultiesMessage').hide();
//             facultySelect.val('');
//         }
//     });

//     // Remove faculty
//     $(document).on('click', '.remove-faculty', function () {
//         $(this).closest('.assigned-faculty').remove();
//         if ($('#assignedFaculties .assigned-faculty').length === 0) {
//             $('#emptyFacultiesMessage').show();
//         }
//     });

//     // Add section
//     $('#addSectionBtn').click(function () {
//         const sectionSelect = $('#sectionSelect');
//         const sectionValue = sectionSelect.val();

//         if (sectionValue) {
//             const sectionName = sectionSelect.find('option:selected').text();
//             const sectionHtml = `
//             <div class="assigned-section" data-section="${sectionValue}">
//                 <i class="fas fa-layer-group me-1"></i>
//                 ${sectionName}
//                 <button type="button" class="btn btn-sm text-danger remove-section">
//                     <i class="fas fa-times"></i>
//                 </button>
//                 <input type="hidden" name="sectionsAssigned[]" value="${sectionValue}">
//             </div>
//             `;

//             $('#assignedSections').append(sectionHtml);
//             $('#emptySectionsMessage').hide();
//             sectionSelect.val('');
//         }
//     });

//     // Remove section
//     $(document).on('click', '.remove-section', function () {
//         $(this).closest('.assigned-section').remove();
//         if ($('#assignedSections .assigned-section').length === 0) {
//             $('#emptySectionsMessage').show();
//         }
//     });

//     // Add new question
//     $('#addQuestionBtn').click(function () {
//         const questionId = new Date().getTime(); // Generate unique ID for question fields
//         const questionTemplate = `
//         <div class="question-item card mb-3" data-question-id="${questionId}">
//             <div class="card-header bg-light d-flex justify-content-between align-items-center">
//                 <h5 class="mb-0">Question</h5>
//                 <button type="button" class="btn btn-sm btn-outline-danger remove-question">
//                     <i class="fas fa-times"></i>
//                 </button>
//             </div>
//             <div class="card-body">
//                 <div class="mb-3">
//                     <label class="form-label">Question Text</label>
//                     <input type="text" class="form-control question-text" name="questions[${questionId}][questionText]" placeholder="Enter your question" required>
//                 </div>
//                 <div class="row">
//                     <div class="col-md-6 mb-3">
//                         <label class="form-label">Question Type</label>
//                         <select class="form-select question-type" name="questions[${questionId}][questionType]">
//                             <option value="rating">Rating</option>
//                             <option value="yes_no">Yes/No</option>
//                             <option value="mcq">Multiple Choice</option>
//                             <option value="text">Text</option>
//                             <option value="grid">Grid</option>
//                             <option value="dropdown">Dropdown</option>
//                             <option value="date">Date</option>
//                         </select>
//                     </div>
//                     <div class="col-md-6 mb-3">
//                         <div class="d-flex align-items-center h-100 pt-4">
//                             <div class="form-check">
//                                 <input class="form-check-input question-required" type="checkbox" name="questions[${questionId}][required]" value="true" checked>
//                                 <label class="form-check-label">Required</label>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="question-options" style="display: none;">
//                     <div class="mb-3 mcq-options">
//                         <label class="form-label">Options (comma separated)</label>
//                         <textarea class="form-control options-text" name="questions[${questionId}][optionsText]" rows="3" placeholder="Option 1, Option 2, Option 3"></textarea>
//                     </div>
//                 </div>
//                 <div class="grid-options" style="display: none;">
//                     <div class="row">
//                         <div class="col-md-6 mb-3">
//                             <label class="form-label">Row Labels (comma separated)</label>
//                             <textarea class="form-control grid-rows" name="questions[${questionId}][gridRows]" rows="3" placeholder="Row 1, Row 2, Row 3"></textarea>
//                         </div>
//                         <div class="col-md-6 mb-3">
//                             <label class="form-label">Column Labels (comma separated)</label>
//                             <textarea class="form-control grid-columns" name="questions[${questionId}][gridColumns]" rows="3" placeholder="Column 1, Column 2, Column 3"></textarea>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//         `;

//         $('#questionsContainer').append(questionTemplate);
//         $('#emptyQuestionsMessage').hide();

//         // Initialize based on the first selected question type
//         const questionType = $('.question-item:last .question-type').val();
//         toggleQuestionOptions(questionType, $('.question-item:last'));
//     });

//     // Remove question
//     $(document).on('click', '.remove-question', function () {
//         $(this).closest('.question-item').remove();
//         if ($('#questionsContainer .question-item').length === 0) {
//             $('#emptyQuestionsMessage').show();
//         }
//     });

//     // Toggle question options based on question type
//     $(document).on('change', '.question-type', function () {
//         const questionType = $(this).val();
//         const questionItem = $(this).closest('.question-item');
//         toggleQuestionOptions(questionType, questionItem);
//     });

//     function toggleQuestionOptions(questionType, questionItem) {
//         const optionsContainer = questionItem.find('.question-options');
//         const gridContainer = questionItem.find('.grid-options');

//         // Hide all containers first
//         optionsContainer.hide();
//         gridContainer.hide();

//         // Show the appropriate container based on the question type
//         if (['mcq', 'dropdown', 'rating'].includes(questionType)) {
//             optionsContainer.show();
//         } else if (questionType === 'grid') {
//             gridContainer.show();
//         }
//     }

//     // Form submission
//     $('#createFormForm').submit(function (e) {
//         e.preventDefault();

//         // Validate form
//         if (!$('#formTitle').val()) {
//             alert('Please enter a form title');
//             $('#formTitle').focus();
//             return false;
//         }

//         if ($('#questionsContainer .question-item').length === 0) {
//             alert('Please add at least one question to your form');
//             return false;
//         }

//         if ($('#assignedFaculties .assigned-faculty').length === 0) {
//             alert('Please assign at least one faculty member');
//             return false;
//         }

//         if ($('#assignedSections .assigned-section').length === 0) {
//             alert('Please assign at least one section');
//             return false;
//         }

//         // Get form type from the hidden input
//         const formType = $('#formType').val();
        
//         // Create form data object
//         const jsonData = {
//             title: $('#formTitle').val(),
//             formType: formType,
//             deadline: $('#formDeadline').val(),
//             semester: $('#semester').val(),
//             createdBy: $('#createdBy').val(),
//             facultyAssigned: [],
//             sectionsAssigned: [],
//             questions: [],
//             status: $('#formStatus').val() || 'active'
//         };

//         // Collect faculty assignments
//         $('#assignedFaculties .assigned-faculty').each(function () {
//             jsonData.facultyAssigned.push($(this).data('id'));
//         });

//         // Collect section assignments
//         $('#assignedSections .assigned-section').each(function () {
//             jsonData.sectionsAssigned.push($(this).data('section'));
//         });

//         // Collect questions
//         $('#questionsContainer .question-item').each(function () {
//             const questionId = $(this).data('question-id');
//             const questionType = $(this).find('.question-type').val();
//             const question = {
//                 questionText: $(this).find('.question-text').val(),
//                 questionType: questionType,
//                 required: $(this).find('.question-required').is(':checked'),
//                 options: []
//             };

//             // Handle options for MCQ, dropdown, and rating
//             if (['mcq', 'dropdown', 'rating'].includes(questionType)) {
//                 const optionsText = $(this).find('.options-text').val();
//                 if (optionsText) {
//                     question.options = optionsText.split(',').map(option => option.trim());
//                 }
//             }

//             // Handle grid options
//             if (questionType === 'grid') {
//                 const rowsText = $(this).find('.grid-rows').val();
//                 const columnsText = $(this).find('.grid-columns').val();
                
//                 question.gridOptions = {
//                     rows: rowsText ? rowsText.split(',').map(row => row.trim()) : [],
//                     columns: columnsText ? columnsText.split(',').map(column => column.trim()) : []
//                 };
//             }

//             jsonData.questions.push(question);
//         });

//         // Add loading indicator
//         const submitBtn = $('button[type="submit"]');
//         const originalBtnText = submitBtn.html();
//         submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Submitting...');
//         submitBtn.prop('disabled', true);

//         // Submit with JSON
//         $.ajax({
//     url: `/admin/adminHome/forms/create/${formType}`,
//     type: 'POST',
//     data: JSON.stringify(jsonData),
//     contentType: 'application/json',
//     dataType: 'json',
//     success: function(response) {
//         submitBtn.html(originalBtnText);
//         submitBtn.prop('disabled', false);
        
//         if (response && response.success) {
//             alert('Form created successfully!');
//             // Use the redirect URL from the response or fallback to Total-Forms
//             window.location.href = response.redirect || '/admin/Total-Forms';
//         } else {
//             const message = response && response.message ? response.message : 'Unknown error';
//             alert('Error creating form: ' + message);
//         }
//     },
//     error: function(xhr, status, error) {
//         submitBtn.html(originalBtnText);
//         submitBtn.prop('disabled', false);
        
//         console.error('Error submitting form:', error);
//         console.error('Status:', status);
//         console.error('Response:', xhr.responseText);
        
//         try {
//             const response = JSON.parse(xhr.responseText);
//             if (response && response.message) {
//                 alert('Error: ' + response.message);
//             } else {
//                 alert('An error occurred while creating the form. Please try again.');
//             }
//         } catch (e) {
//             alert('An error occurred while creating the form. Please try again.');
//         }
//     }
// });   
//     });
// });
//     </script>
// </body>
// </html>









// edit
// <!DOCTYPE html>
// <html lang="en">

// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Edit Feedback Form</title>
//     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
//     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
//     <style>
//         :root {
//             --primary-color: #2c3e50;
//             --primary-light: #eaecef;
//             --secondary-color: #6c757d;
//             --success-color: #27ae60;
//             --danger-color: #c0392b;
//             --light-bg: #f8f9fa;
//             --dark-text: #2c3e50;
//             --border-radius: 0.375rem;
//             --box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
//             --transition: all 0.25s ease;
//         }

//         body {
//             font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
//             color: var(--dark-text);
//             background-color: #f5f7fa;
//             line-height: 1.6;
//             overflow-x: hidden;
//         }

//         /* Layout container */
//         .app-container {
//             display: flex;
//             width: 100%;
//         }

//         .content-area {
//             flex: 1;
//             min-width: 0;
//             padding: 1.5rem;
//             width: 100%;
//             transition: var(--transition);
//         }

//         /* For side navbar */
//         .side-navbar {
//             width: 250px;
//             min-height: 100vh;
//             position: sticky;
//             top: 0;
//         }

//         /* Main container styles */
//         .main-container {
//             width: 100%;
//             padding: 1.5rem 0;
//         }

//         .page-title {
//             font-weight: 600;
//             color: var(--dark-text);
//             margin-bottom: 1.75rem;
//             position: relative;
//             padding-bottom: 0.75rem;
//             font-size: 1.75rem;
//         }

//         .page-title:after {
//             content: '';
//             position: absolute;
//             bottom: 0;
//             left: 0;
//             width: 60px;
//             height: 3px;
//             background-color: var(--primary-color);
//         }

//         .card {
//             border-radius: var(--border-radius);
//             border: none;
//             box-shadow: var(--box-shadow);
//             transition: var(--transition);
//             margin-bottom: 2rem;
//             width: 100%;
//         }

//         .card-header {
//             background-color: var(--primary-color);
//             color: white;
//             border-bottom: none;
//             padding: 1.25rem 1.5rem;
//             border-top-left-radius: var(--border-radius);
//             border-top-right-radius: var(--border-radius);
//             font-weight: 500;
//         }

//         .card-body {
//             padding: 1.75rem;
//         }

//         .form-section {
//             background-color: var(--light-bg);
//             padding: 1.75rem;
//             border-radius: var(--border-radius);
//             margin-bottom: 2rem;
//             border: 1px solid rgba(0, 0, 0, 0.1);
//         }

//         .form-section-title {
//             font-weight: 600;
//             color: var(--primary-color);
//             margin-bottom: 1.25rem;
//             display: flex;
//             align-items: center;
//             gap: 0.75rem;
//             font-size: 1.25rem;
//         }

//         .form-section-icon {
//             background-color: var(--primary-light);
//             color: var(--primary-color);
//             padding: 0.5rem;
//             border-radius: 50%;
//             display: inline-flex;
//             align-items: center;
//             justify-content: center;
//             width: 40px;
//             height: 40px;
//         }

//         .field-item {
//             padding: 1.25rem;
//             margin-bottom: 1.25rem;
//             background-color: #fff;
//             border-radius: var(--border-radius);
//             border: 1px solid #e0e5ec;
//             transition: var(--transition);
//             position: relative;
//             box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
//         }

//         .field-item:hover {
//             border-color: var(--primary-color);
//             box-shadow: 0 0 0 0.25rem rgba(44, 62, 80, 0.1);
//         }

//         .field-handle {
//             cursor: move;
//             color: var(--secondary-color);
//             padding: 0.5rem;
//         }

//         .field-options-container {
//             background-color: var(--light-bg);
//             padding: 1rem;
//             border-radius: var(--border-radius);
//             margin-top: 1rem;
//             border: 1px solid #e0e5ec;
//         }

//         .assigned-faculty, .assigned-section, .assigned-semester, .assigned-subject {
//             display: inline-flex;
//             align-items: center;
//             margin: 0.375rem;
//             padding: 0.5rem 0.875rem;
//             background-color: var(--primary-light);
//             color: var(--primary-color);
//             border-radius: 2rem;
//             font-size: 0.875rem;
//             border: 1px solid rgba(44, 62, 80, 0.2);
//             transition: var(--transition);
//         }

//         .assigned-faculty:hover, .assigned-section:hover, .assigned-semester:hover, .assigned-subject:hover {
//             background-color: rgba(44, 62, 80, 0.1);
//         }

//         .remove-faculty, .remove-section, .remove-semester, .remove-subject {
//             background: none;
//             border: none;
//             color: var(--danger-color);
//             margin-left: 0.5rem;
//             padding: 0;
//             font-size: 0.75rem;
//         }

//         .btn-primary {
//             background-color: var(--primary-color);
//             border-color: var(--primary-color);
//             transition: var(--transition);
//         }

//         .btn-primary:hover {
//             background-color: #1e2b38;
//             border-color: #1e2b38;
//         }

//         .btn-outline-primary {
//             color: var(--primary-color);
//             border-color: var(--primary-color);
//         }

//         .btn-outline-primary:hover {
//             background-color: var(--primary-color);
//             border-color: var(--primary-color);
//         }

//         .form-control,
//         .form-select {
//             padding: 0.625rem 0.875rem;
//             border-radius: var(--border-radius);
//             border: 1px solid #d1d9e6;
//             transition: var(--transition);
//             font-size: 0.95rem;
//         }

//         .form-control:focus,
//         .form-select:focus {
//             border-color: var(--primary-color);
//             box-shadow: 0 0 0 0.25rem rgba(44, 62, 80, 0.25);
//         }

//         .form-label {
//             font-weight: 500;
//             margin-bottom: 0.5rem;
//             color: #495057;
//         }

//         .form-switch .form-check-input {
//             height: 1.25rem;
//             width: 2.5rem;
//         }

//         .form-switch .form-check-input:checked {
//             background-color: var(--primary-color);
//             border-color: var(--primary-color);
//         }

//         .empty-container {
//             padding: 2.5rem;
//             text-align: center;
//             color: var(--secondary-color);
//             border: 2px dashed #dee2e6;
//             border-radius: var(--border-radius);
//             background-color: rgba(222, 226, 230, 0.2);
//         }

//         .empty-container i {
//             font-size: 2rem;
//             margin-bottom: 1rem;
//             color: #adb5bd;
//         }

//         .empty-container p {
//             margin-bottom: 0;
//             font-size: 1rem;
//         }

//         .action-buttons {
//             display: flex;
//             justify-content: flex-end;
//             gap: 0.75rem;
//             margin-top: 2rem;
//         }

//         .action-buttons .btn {
//             padding: 0.625rem 1.75rem;
//             font-weight: 500;
//             min-width: 120px;
//         }

//         /* Modal styles */
//         .modal-content {
//             border: none;
//             border-radius: var(--border-radius);
//             box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
//         }

//         .modal-header {
//             background-color: var(--primary-color);
//             color: white;
//             border-bottom: none;
//             border-top-left-radius: var(--border-radius);
//             border-top-right-radius: var(--border-radius);
//         }

//         .modal-title {
//             font-weight: 500;
//         }

//         .modal-body {
//             padding: 1.75rem;
//         }

//         .modal-footer {
//             border-top: 1px solid #e9ecef;
//             padding: 1rem 1.75rem;
//         }

//         /* Toast styles */
//         .toast {
//             border: none;
//             border-radius: var(--border-radius);
//             box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
//         }

//         .toast-header {
//             border-bottom: none;
//             border-top-left-radius: var(--border-radius);
//             border-top-right-radius: var(--border-radius);
//         }

//         .question-item {
//             transition: var(--transition);
//         }

//         .question-item:hover {
//             box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.15);
//         }

//         /* Responsive adjustments */
//         @media (max-width: 991px) {
//             .card-body {
//                 padding: 1.5rem;
//             }

//             .form-section {
//                 padding: 1.5rem;
//             }
            
//             .content-area {
//                 padding: 1rem;
//             }
//         }

//         @media (max-width: 767px) {
//             .field-item .row [class*="col-"] {
//                 margin-bottom: 1rem;
//             }

//             .field-item .row [class*="col-"]:last-child {
//                 margin-bottom: 0;
//             }

//             .action-buttons {
//                 flex-direction: column;
//                 width: 100%;
//                 gap: 0.5rem;
//             }

//             .action-buttons .btn {
//                 width: 100%;
//             }

//             .card-body {
//                 padding: 1.25rem;
//             }

//             .form-section {
//                 padding: 1.25rem;
//             }

//             .page-title {
//                 font-size: 1.5rem;
//             }

//             .form-section-title {
//                 font-size: 1.125rem;
//             }
            
//             .content-area {
//                 padding: 0.75rem;
//             }
//         }

//         @media (max-width: 575px) {
//             .field-item {
//                 padding: 1rem;
//             }

//             .empty-container {
//                 padding: 2rem 1rem;
//             }

//             .field-options-container {
//                 padding: 0.875rem;
//             }
            
//             .content-area {
//                 padding: 0.5rem;
//             }
//         }
//     </style>
// </head>

// <body>
//     <%- include('partials/adminTopNavbar', { admin: adminData }) %>
    
//     <div class="app-container">
//         <!-- Side Navbar -->
//         <div class="side-navbar">
//             <%- include('./partials/adminSideNavbar', { path: currentPath, admin: adminData }) %>
//         </div>
        
//         <!-- Main Content Area -->
//         <div class="content-area">
//             <h2 class="page-title">Edit Feedback Form</h2>

//             <div class="card">
//                 <div class="card-header d-flex justify-content-between align-items-center">
//                     <span>Update Feedback Form</span>
//                 </div>
//                 <div class="card-body">
//                     <form id="editFormForm">
//                         <div class="row mb-4">
//                             <div class="col-lg-6 mb-3 mb-lg-0">
//                                 <div class="mb-3">
//                                     <label for="formType" class="form-label">Form Type</label>
//                                     <input type="text" class="form-control" value="<%= form.formType %>" readonly>
//                                     <input type="hidden" id="formType" name="formType" value="<%= form.formType %>">
//                                     <input type="hidden" id="formId" name="formId" value="<%= form._id %>">
//                                 </div>

//                                 <div class="mb-3">
//                                     <label for="formTitle" class="form-label">Form Title</label>
//                                     <input type="text" class="form-control" id="formTitle" name="title" required
//                                         placeholder="Enter descriptive title" value="<%= form.title %>">
//                                 </div>
//                             </div>

//                             <div class="col-lg-6">
//                                 <div class="mb-3">
//                                     <label for="formDeadline" class="form-label">Submission Deadline</label>
//                                     <input type="date" class="form-control" id="formDeadline" name="deadline"
//                                         value="<%= form.deadline ? new Date(form.deadline).toISOString().split('T')[0] : '' %>">
//                                     <small class="text-muted">Leave blank for no deadline</small>
//                                 </div>

//                                 <input type="hidden" id="createdBy" name="createdBy" value="<%= form.createdBy %>">

//                                 <div class="mb-3">
//                                     <label class="form-label">Form Status</label>
//                                     <select class="form-select" id="formStatus" name="status">
//                                         <% statusOptions.forEach(function(status) { %>
//                                             <option value="<%= status %>" <%= form.status === status ? 'selected' : '' %>>
//                                                 <%= status.charAt(0).toUpperCase() + status.slice(1) %>
//                                             </option>
//                                         <% }); %>
//                                     </select>
//                                     <small class="text-muted">Active forms are immediately available for submission</small>
//                                 </div>
//                             </div>
//                         </div>

//                         <!-- Semester Assignment Section -->
//                         <div class="form-section">
//                             <div class="form-section-title">
//                                 <span class="form-section-icon"><i class="fas fa-calendar-alt"></i></span>
//                                 Semester Assignment
//                             </div>

//                             <div class="row align-items-end">
//                                 <div class="col-md-8 mb-3 mb-md-0">
//                                     <label for="semesterSelect" class="form-label">Select Semester</label>
//                                     <select class="form-select" id="semesterSelect">
//                                         <option value="">-- Select Semester --</option>
//                                         <% semesterCategories.forEach(function(semester) { %>
//                                             <option value="<%= semester %>">
//                                                 <%= semester %>
//                                             </option>
//                                         <% }); %>
//                                     </select>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <button type="button" class="btn btn-outline-primary w-100" id="addSemesterBtn">
//                                         <i class="fas fa-plus me-2"></i> Assign Semester
//                                     </button>
//                                 </div>
//                             </div>

//                             <div id="assignedSemesters" class="mt-3">
//                                 <% if(form.semesters && form.semesters.length > 0) { %>
//                                     <% form.semesters.forEach(function(semester) { %>
//                                         <div class="assigned-semester" data-semester="<%= semester %>">
//                                             <i class="fas fa-calendar-alt me-1"></i>
//                                             <%= semester %>
//                                             <button type="button" class="btn btn-sm text-danger remove-semester">
//                                                 <i class="fas fa-times"></i>
//                                             </button>
//                                             <input type="hidden" name="semesters[]" value="<%= semester %>">
//                                         </div>
//                                     <% }); %>
//                                 <% } else { %>
//                                     <div class="empty-container" id="emptySemestersMessage">
//                                         <i class="fas fa-calendar-alt"></i>
//                                         <p>No semesters have been assigned to this form yet.</p>
//                                     </div>
//                                 <% } %>
//                             </div>
//                         </div>

//                         <!-- Faculty Assignment Section -->
//                         <div class="form-section">
//                             <div class="form-section-title">
//                                 <span class="form-section-icon"><i class="fas fa-user-tie"></i></span>
//                                 Faculty Assignment
//                             </div>

//                             <div class="row align-items-end">
//                                 <div class="col-md-8 mb-3 mb-md-0">
//                                     <label for="facultySelect" class="form-label">Select Faculty Members</label>
//                                     <select class="form-select" id="facultySelect">
//                                         <option value="">-- Select Faculty --</option>
//                                         <% faculties.forEach(function(faculty) { %>
//                                             <option value="<%= faculty._id %>">
//                                                 <%= faculty.name %> (<%= faculty.department %>)
//                                             </option>
//                                         <% }); %>
//                                     </select>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <button type="button" class="btn btn-outline-primary w-100" id="addFacultyBtn">
//                                         <i class="fas fa-user-plus me-2"></i> Assign Faculty
//                                     </button>
//                                 </div>
//                             </div>

//                             <div id="assignedFaculties" class="mt-3">
//                                 <% if(form.facultyAssigned && form.facultyAssigned.length > 0) { %>
//                                     <% form.facultyAssigned.forEach(function(faculty) { 
//                                         const facultyData = faculties.find(f => f._id.toString() === faculty.toString() || f._id === faculty);
//                                         if(facultyData) { %>
//                                         <div class="assigned-faculty" data-id="<%= faculty %>">
//                                             <i class="fas fa-user-tie me-1"></i>
//                                             <%= facultyData.name %> (<%= facultyData.department %>)
//                                             <button type="button" class="btn btn-sm text-danger remove-faculty">
//                                                 <i class="fas fa-times"></i>
//                                             </button>
//                                             <input type="hidden" name="facultyAssigned[]" value="<%= faculty %>">
//                                         </div>
//                                     <% } %>
//                                 <% }); %>
//                                 <% } else { %>
//                                     <div class="empty-container" id="emptyFacultiesMessage">
//                                         <i class="fas fa-user-check"></i>
//                                         <p>No faculty members have been assigned to this form yet.</p>
//                                     </div>
//                                 <% } %>
//                             </div>
//                         </div>

//                         <!-- Section Assignment -->
//                         <div class="form-section">
//                             <div class="form-section-title">
//                                 <span class="form-section-icon"><i class="fas fa-layer-group"></i></span>
//                                 Section Assignment
//                             </div>

//                             <div class="row align-items-end">
//                                 <div class="col-md-8 mb-3 mb-md-0">
//                                     <label for="sectionSelect" class="form-label">Select Sections</label>
//                                     <select class="form-select" id="sectionSelect">
//                                         <option value="">-- Select Section --</option>
//                                         <% sectionCategories.forEach(function(section) { %>
//                                             <option value="<%= section %>">
//                                                 <%= section %>
//                                             </option>
//                                         <% }); %>
//                                     </select>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <button type="button" class="btn btn-outline-primary w-100" id="addSectionBtn">
//                                         <i class="fas fa-plus me-2"></i> Assign Section
//                                     </button>
//                                 </div>
//                             </div>

//                             <div id="assignedSections" class="mt-3">
//                                 <% if(form.sectionsAssigned && form.sectionsAssigned.length > 0) { %>
//                                     <% form.sectionsAssigned.forEach(function(section) { %>
//                                         <div class="assigned-section" data-section="<%= section %>">
//                                             <i class="fas fa-layer-group me-1"></i>
//                                             <%= section %>
//                                             <button type="button" class="btn btn-sm text-danger remove-section">
//                                                 <i class="fas fa-times"></i>
//                                             </button>
//                                             <input type="hidden" name="sectionsAssigned[]" value="<%= section %>">
//                                         </div>
//                                     <% }); %>
//                                 <% } else { %>
//                                     <div class="empty-container" id="emptySectionsMessage">
//                                         <i class="fas fa-layer-group"></i>
//                                         <p>No sections have been assigned to this form yet.</p>
//                                     </div>
//                                 <% } %>
//                             </div>
//                         </div>
                        
//                         <!-- Subject Assignment -->
//                         <div class="form-section">
//                             <div class="form-section-title">
//                                 <span class="form-section-icon"><i class="fas fa-book"></i></span>
//                                 Subject Assignment
//                             </div>

//                             <div class="row align-items-end">
//                                 <div class="col-md-8 mb-3 mb-md-0">
//                                     <label for="subjectSelect" class="form-label">Select Subject</label>
//                                     <select class="form-select" id="subjectSelect">
//                                         <option value="">-- Select Subject --</option>
//                                         <% subjects.forEach(function(subject) { %>
//                                             <option value="<%= subject %>">
//                                                 <%= subject %>
//                                             </option>
//                                         <% }); %>
//                                     </select>
//                                 </div>
//                                 <div class="col-md-4">
//                                     <button type="button" class="btn btn-outline-primary w-100" id="addSubjectBtn">
//                                         <i class="fas fa-plus me-2"></i> Assign Subject
//                                     </button>
//                                 </div>
//                             </div>

//                             <div id="assignedSubjects" class="mt-3">
//                                 <% if(form.subjects && form.subjects.length > 0) { %>
//                                     <% form.subjects.forEach(function(subject) { %>
//                                         <div class="assigned-section" data-subject="<%= subject %>">
//                                             <i class="fas fa-book me-1"></i>
//                                             <%= subject %>
//                                             <button type="button" class="btn btn-sm text-danger remove-subject">
//                                                 <i class="fas fa-times"></i>
//                                             </button>
//                                             <input type="hidden" name="subjects[]" value="<%= subject %>">
//                                         </div>
//                                     <% }); %>
//                                 <% } else { %>
//                                     <div class="empty-container" id="emptySubjectsMessage">
//                                         <i class="fas fa-book"></i>
//                                         <p>No subjects have been assigned to this form yet.</p>
//                                     </div>
//                                 <% } %>
//                             </div>
//                         </div>

//                         <!-- Form Sections -->
//                         <div class="form-section">
//                             <div class="form-section-title">
//                                 <span class="form-section-icon"><i class="fas fa-list-alt"></i></span>
//                                 Form Sections
//                             </div>
                            
//                             <div id="formSections">
//                                 <% if (form.sections && form.sections.length > 0) { %>
//                                     <% form.sections.forEach(function(section, sectionIndex) { %>
//                                         <div class="form-section-item mb-4" data-section-index="<%= sectionIndex %>">
//                                             <div class="card">
//                                                 <div class="card-header bg-light d-flex justify-content-between align-items-center">
//                                                     <h5 class="mb-0">Section <%= sectionIndex + 1 %></h5>
//                                                     <button type="button" class="btn btn-sm btn-outline-danger remove-section-btn">
//                                                         <i class="fas fa-times"></i>
//                                                     </button>
//                                                 </div>
//                                                 <div class="card-body">
//                                                     <div class="mb-3">
//                                                         <label class="form-label">Section Title</label>
//                                                         <input type="text" class="form-control" 
//                                                             name="sections[<%= sectionIndex %>][title]" 
//                                                             value="<%= section.title %>" required>
//                                                     </div>
//                                                     <div class="mb-3">
//                                                         <label class="form-label">Section Description</label>
//                                                         <textarea class="form-control" 
//                                                             name="sections[<%= sectionIndex %>][description]" 
//                                                             rows="2"><%= section.description %></textarea>
//                                                     </div>
                                                    
//                                                     <!-- Questions within this section -->
//                                                     <div class="section-questions mt-4">
//                                                         <h6>Questions in this section</h6>
                                                        
//                                                         <% if (section.questions && section.questions.length > 0) { %>
//                                                             <% section.questions.forEach(function(question, questionIndex) { %>
//                                                                 <div class="question-item card mb-3" data-question-index="<%= questionIndex %>">
//                                                                     <div class="card-header bg-light d-flex justify-content-between align-items-center">
//                                                                         <h6 class="mb-0">Question <%= questionIndex + 1 %></h6>
//                                                                         <button type="button" class="btn btn-sm btn-outline-danger remove-question-btn">
//                                                                             <i class="fas fa-times"></i>
//                                                                         </button>
//                                                                     </div>
//                                                                     <div class="card-body">
//                                                                         <div class="mb-3">
//                                                                             <label class="form-label">Question Text</label>
//                                                                             <input type="text" class="form-control"
//                                                                                 name="sections[<%= sectionIndex %>][questions][<%= questionIndex %>][questionText]"
//                                                                                 value="<%= question.questionText %>" required>
//                                                                         </div>
//                                                                         <div class="row">
//                                                                             <div class="col-md-6 mb-3">
//                                                                                 <label class="form-label">Question Type</label>
//                                                                                 <select class="form-select question-type"
//                                                                                     name="sections[<%= sectionIndex %>][questions][<%= questionIndex %>][questionType]">
//                                                                                     <option value="rating" <%= question.questionType === 'rating' ? 'selected' : '' %>>Rating</option>
//                                                                                     <option value="yes_no" <%= question.questionType === 'yes_no' ? 'selected' : '' %>>Yes/No</option>
//                                                                                     <option value="mcq" <%= question.questionType === 'mcq' ? 'selected' : '' %>>Multiple Choice</option>
//                                                                                     <option value="text" <%= question.questionType === 'text' ? 'selected' : '' %>>Text</option>
//                                                                                     <option value="grid" <%= question.questionType === 'grid' ? 'selected' : '' %>>Grid</option>
//                                                                                     <option value="dropdown" <%= question.questionType === 'dropdown' ? 'selected' : '' %>>Dropdown</option>
//                                                                                     <option value="date" <%= question.questionType === 'date' ? 'selected' : '' %>>Date</option>
//                                                                                 </select>
//                                                                             </div>
//                                                                             <div class="col-md-6 mb-3">
//                                                                                 <div class="form-check mt-4">
//                                                                                     <input class="form-check-input" type="checkbox"
//                                                                                         name="sections[<%= sectionIndex %>][questions][<%= questionIndex %>][required]"
//                                                                                         value="true" <%= question.required ? 'checked' : '' %>>
//                                                                                     <label class="form-check-label">Required</label>
//                                                                                 </div>
//                                                                             </div>
//                                                                         </div>
                                                                        
//                                                                         <div class="question-options" style="display: <%= ['mcq', 'dropdown', 'rating'].includes(question.questionType) ? 'block' : 'none' %>;">
//                                                                             <div class="mb-3">
//                                                                                 <label class="form-label">Options (comma separated)</label>
//                                                                                 <textarea class="form-control"
//                                                                                     name="sections[<%= sectionIndex %>][questions][<%= questionIndex %>][options]"
//                                                                                     rows="3"><%= question.options ? question.options.join(', ') : '' %></textarea>
//                                                                             </div>
//                                                                         </div>
//                                                                     </div>
//                                                                 </div>
//                                                             <% }); %>
//                                                        <!-- Continuation of the form from where it left off -->
//                                                        <% } else { %>
//                                                         <div class="empty-container section-empty-questions">
//                                                             <i class="fas fa-question-circle"></i>
//                                                             <p>No questions added to this section yet.</p>
//                                                         </div>
//                                                     <% } %>
                                                    
//                                                     <button type="button" class="btn btn-primary add-question-btn mt-3">
//                                                         <i class="fas fa-plus me-2"></i> Add Question
//                                                     </button>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 <% }); %>
//                             <% } else { %>
//                                 <div class="empty-container" id="emptySectionsContainer">
//                                     <i class="fas fa-clipboard-list"></i>
//                                     <p>No sections have been added to this form yet.</p>
//                                 </div>
//                             <% } %>
//                         </div>
                        
//                         <button type="button" class="btn btn-primary mt-3" id="addSectionBtn">
//                             <i class="fas fa-plus me-2"></i> Add New Section
//                         </button>
//                     </div>

//                     <div class="action-buttons">
//                         <a href="/admin/forms" class="btn btn-outline-secondary">
//                             <i class="fas fa-arrow-left me-2"></i> Cancel
//                         </a>
//                         <button type="submit" class="btn btn-primary">
//                             <i class="fas fa-save me-2"></i> Save Changes
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     </div>
// </div>

// <!-- Add Question Modal -->
// <div class="modal fade" id="addQuestionModal" tabindex="-1" aria-labelledby="addQuestionModalLabel" aria-hidden="true">
//     <div class="modal-dialog modal-lg">
//         <div class="modal-content">
//             <div class="modal-header">
//                 <h5 class="modal-title" id="addQuestionModalLabel">Add New Question</h5>
//                 <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
//             </div>
//             <div class="modal-body">
//                 <form id="addQuestionForm">
//                     <input type="hidden" id="sectionIndexForQuestion" value="">
                    
//                     <div class="mb-3">
//                         <label for="questionText" class="form-label">Question Text</label>
//                         <input type="text" class="form-control" id="questionText" required 
//                             placeholder="Enter your question">
//                     </div>
                    
//                     <div class="row">
//                         <div class="col-md-6 mb-3">
//                             <label for="questionType" class="form-label">Question Type</label>
//                             <select class="form-select" id="questionType">
//                                 <option value="rating">Rating</option>
//                                 <option value="yes_no">Yes/No</option>
//                                 <option value="mcq">Multiple Choice</option>
//                                 <option value="text">Text</option>
//                                 <option value="grid">Grid</option>
//                                 <option value="dropdown">Dropdown</option>
//                                 <option value="date">Date</option>
//                             </select>
//                         </div>
//                         <div class="col-md-6 mb-3">
//                             <div class="form-check mt-4">
//                                 <input class="form-check-input" type="checkbox" id="questionRequired" value="true">
//                                 <label class="form-check-label" for="questionRequired">Required</label>
//                             </div>
//                         </div>
//                     </div>
                    
//                     <div id="questionOptionsContainer" class="mb-3" style="display: none;">
//                         <label for="questionOptions" class="form-label">Options (comma separated)</label>
//                         <textarea class="form-control" id="questionOptions" rows="3" 
//                             placeholder="Option 1, Option 2, Option 3"></textarea>
//                     </div>
//                 </form>
//             </div>
//             <div class="modal-footer">
//                 <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
//                 <button type="button" class="btn btn-primary" id="saveQuestionBtn">Add Question</button>
//             </div>
//         </div>
//     </div>
// </div>

// <!-- Add Section Modal -->
// <div class="modal fade" id="addSectionModal" tabindex="-1" aria-labelledby="addSectionModalLabel" aria-hidden="true">
//     <div class="modal-dialog">
//         <div class="modal-content">
//             <div class="modal-header">
//                 <h5 class="modal-title" id="addSectionModalLabel">Add New Section</h5>
//                 <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
//             </div>
//             <div class="modal-body">
//                 <form id="addSectionForm">
//                     <div class="mb-3">
//                         <label for="sectionTitle" class="form-label">Section Title</label>
//                         <input type="text" class="form-control" id="sectionTitle" required 
//                             placeholder="Enter section title">
//                     </div>
//                     <div class="mb-3">
//                         <label for="sectionDescription" class="form-label">Section Description</label>
//                         <textarea class="form-control" id="sectionDescription" rows="3" 
//                             placeholder="Enter section description (optional)"></textarea>
//                     </div>
//                 </form>
//             </div>
//             <div class="modal-footer">
//                 <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
//                 <button type="button" class="btn btn-primary" id="saveSectionBtn">Add Section</button>
//             </div>
//         </div>
//     </div>
// </div>

// <!-- Confirmation Modal -->
// <div class="modal fade" id="confirmationModal" tabindex="-1" aria-labelledby="confirmationModalLabel" aria-hidden="true">
//     <div class="modal-dialog">
//         <div class="modal-content">
//             <div class="modal-header">
//                 <h5 class="modal-title" id="confirmationModalLabel">Confirm Action</h5>
//                 <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
//             </div>
//             <div class="modal-body">
//                 <p id="confirmationMessage">Are you sure you want to proceed with this action?</p>
//             </div>
//             <div class="modal-footer">
//                 <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
//                 <button type="button" class="btn btn-danger" id="confirmActionBtn">Confirm</button>
//             </div>
//         </div>
//     </div>
// </div>

// <!-- Success Toast -->
// <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
//     <div id="successToast" class="toast hide" role="alert" aria-live="assertive" aria-atomic="true">
//         <div class="toast-header bg-success text-white">
//             <strong class="me-auto">Success</strong>
//             <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
//         </div>
//         <div class="toast-body" id="successToastMessage">
//             Changes saved successfully!
//         </div>
//     </div>
// </div>

// <!-- Error Toast -->
// <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
//     <div id="errorToast" class="toast hide" role="alert" aria-live="assertive" aria-atomic="true">
//         <div class="toast-header bg-danger text-white">
//             <strong class="me-auto">Error</strong>
//             <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
//         </div>
//         <div class="toast-body" id="errorToastMessage">
//             An error occurred. Please try again.
//         </div>
//     </div>
// </div>

// <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
// <script>
//     $(document).ready(function() {
//         // Initialize Bootstrap tooltips
//         var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
//         var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
//             return new bootstrap.Tooltip(tooltipTriggerEl)
//         });
        
//         // Variables to track current sections and questions
//         let currentSectionIndex = <%= form.sections ? form.sections.length : 0 %>;
        
//         // Toggle empty containers based on content
//         function toggleEmptyContainers() {
//             // Semester assignments
//             if ($('#assignedSemesters .assigned-semester').length > 0) {
//                 $('#emptySemestersMessage').hide();
//             } else {
//                 $('#emptySemestersMessage').show();
//             }
            
//             // Faculty assignments
//             if ($('#assignedFaculties .assigned-faculty').length > 0) {
//                 $('#emptyFacultiesMessage').hide();
//             } else {
//                 $('#emptyFacultiesMessage').show();
//             }
            
//             // Section assignments
//             if ($('#assignedSections .assigned-section').length > 0) {
//                 $('#emptySectionsMessage').hide();
//             } else {
//                 $('#emptySectionsMessage').show();
//             }
            
//             // Subject assignments
//             if ($('#assignedSubjects .assigned-section').length > 0) {
//                 $('#emptySubjectsMessage').hide();
//             } else {
//                 $('#emptySubjectsMessage').show();
//             }
            
//             // Form sections
//             if ($('#formSections .form-section-item').length > 0) {
//                 $('#emptySectionsContainer').hide();
//             } else {
//                 $('#emptySectionsContainer').show();
//             }
//         }
        
//         // Initialize the view
//         toggleEmptyContainers();
        
//         // ----- SEMESTER ASSIGNMENT HANDLING -----
//         $('#addSemesterBtn').click(function() {
//             const semester = $('#semesterSelect').val();
//             if (!semester) return;
            
//             // Check if already added
//             if ($(`#assignedSemesters .assigned-semester[data-semester="${semester}"]`).length) {
//                 showToast('errorToast', 'This semester is already assigned.');
//                 return;
//             }
            
//             // Add semester to the list
//             const semesterHtml = `
//                 <div class="assigned-semester" data-semester="${semester}">
//                     <i class="fas fa-calendar-alt me-1"></i>
//                     ${semester}
//                     <button type="button" class="btn btn-sm text-danger remove-semester">
//                         <i class="fas fa-times"></i>
//                     </button>
//                     <input type="hidden" name="semesters[]" value="${semester}">
//                 </div>
//             `;
            
//             $('#assignedSemesters').append(semesterHtml);
//             $('#semesterSelect').val('');
//             toggleEmptyContainers();
//         });
        
//         // Remove semester
//         $(document).on('click', '.remove-semester', function() {
//             $(this).closest('.assigned-semester').remove();
//             toggleEmptyContainers();
//         });
        
//         // ----- FACULTY ASSIGNMENT HANDLING -----
//         $('#addFacultyBtn').click(function() {
//             const facultyId = $('#facultySelect').val();
//             if (!facultyId) return;
            
//             // Check if already added
//             if ($(`#assignedFaculties .assigned-faculty[data-id="${facultyId}"]`).length) {
//                 showToast('errorToast', 'This faculty member is already assigned.');
//                 return;
//             }
            
//             // Get faculty name from select option
//             const facultyName = $('#facultySelect option:selected').text();
            
//             // Add faculty to the list
//             const facultyHtml = `
//                 <div class="assigned-faculty" data-id="${facultyId}">
//                     <i class="fas fa-user-tie me-1"></i>
//                     ${facultyName}
//                     <button type="button" class="btn btn-sm text-danger remove-faculty">
//                         <i class="fas fa-times"></i>
//                     </button>
//                     <input type="hidden" name="facultyAssigned[]" value="${facultyId}">
//                 </div>
//             `;
            
//             $('#assignedFaculties').append(facultyHtml);
//             $('#facultySelect').val('');
//             toggleEmptyContainers();
//         });
        
//         // Remove faculty
//         $(document).on('click', '.remove-faculty', function() {
//             $(this).closest('.assigned-faculty').remove();
//             toggleEmptyContainers();
//         });
        
//         // ----- SECTION ASSIGNMENT HANDLING -----
//         $('#addSectionBtn').click(function() {
//             const section = $('#sectionSelect').val();
//             if (!section) return;
            
//             // Check if already added
//             if ($(`#assignedSections .assigned-section[data-section="${section}"]`).length) {
//                 showToast('errorToast', 'This section is already assigned.');
//                 return;
//             }
            
//             // Add section to the list
//             const sectionHtml = `
//                 <div class="assigned-section" data-section="${section}">
//                     <i class="fas fa-layer-group me-1"></i>
//                     ${section}
//                     <button type="button" class="btn btn-sm text-danger remove-section">
//                         <i class="fas fa-times"></i>
//                     </button>
//                     <input type="hidden" name="sectionsAssigned[]" value="${section}">
//                 </div>
//             `;
            
//             $('#assignedSections').append(sectionHtml);
//             $('#sectionSelect').val('');
//             toggleEmptyContainers();
//         });
        
//         // Remove section
//         $(document).on('click', '.remove-section', function() {
//             $(this).closest('.assigned-section').remove();
//             toggleEmptyContainers();
//         });
        
//         // ----- SUBJECT ASSIGNMENT HANDLING -----
//         $('#addSubjectBtn').click(function() {
//             const subject = $('#subjectSelect').val();
//             if (!subject) return;
            
//             // Check if already added
//             if ($(`#assignedSubjects .assigned-section[data-subject="${subject}"]`).length) {
//                 showToast('errorToast', 'This subject is already assigned.');
//                 return;
//             }
            
//             // Add subject to the list
//             const subjectHtml = `
//                 <div class="assigned-section" data-subject="${subject}">
//                     <i class="fas fa-book me-1"></i>
//                     ${subject}
//                     <button type="button" class="btn btn-sm text-danger remove-subject">
//                         <i class="fas fa-times"></i>
//                     </button>
//                     <input type="hidden" name="subjects[]" value="${subject}">
//                 </div>
//             `;
            
//             $('#assignedSubjects').append(subjectHtml);
//             $('#subjectSelect').val('');
//             toggleEmptyContainers();
//         });
        
//         // Remove subject
//         $(document).on('click', '.remove-subject', function() {
//             $(this).closest('.assigned-section').remove();
//             toggleEmptyContainers();
//         });
        
//         // ----- FORM SECTIONS HANDLING -----
//         // Add new section (open modal)
//         $('#addSectionBtn').click(function() {
//             $('#sectionTitle').val('');
//             $('#sectionDescription').val('');
//             $('#addSectionModal').modal('show');
//         });
        
//         // Save new section
//         $('#saveSectionBtn').click(function() {
//             const sectionTitle = $('#sectionTitle').val();
//             if (!sectionTitle) return;
            
//             const sectionDescription = $('#sectionDescription').val();
            
//             // Create new section HTML
//             const sectionHtml = `
//                 <div class="form-section-item mb-4" data-section-index="${currentSectionIndex}">
//                     <div class="card">
//                         <div class="card-header bg-light d-flex justify-content-between align-items-center">
//                             <h5 class="mb-0">Section ${currentSectionIndex + 1}</h5>
//                             <button type="button" class="btn btn-sm btn-outline-danger remove-section-btn">
//                                 <i class="fas fa-times"></i>
//                             </button>
//                         </div>
//                         <div class="card-body">
//                             <div class="mb-3">
//                                 <label class="form-label">Section Title</label>
//                                 <input type="text" class="form-control" 
//                                     name="sections[${currentSectionIndex}][title]" 
//                                     value="${sectionTitle}" required>
//                             </div>
//                             <div class="mb-3">
//                                 <label class="form-label">Section Description</label>
//                                 <textarea class="form-control" 
//                                     name="sections[${currentSectionIndex}][description]" 
//                                     rows="2">${sectionDescription}</textarea>
//                             </div>
                            
//                             <!-- Questions within this section -->
//                             <div class="section-questions mt-4">
//                                 <h6>Questions in this section</h6>
//                                 <div class="empty-container section-empty-questions">
//                                     <i class="fas fa-question-circle"></i>
//                                     <p>No questions added to this section yet.</p>
//                                 </div>
//                                 <button type="button" class="btn btn-primary add-question-btn mt-3">
//                                     <i class="fas fa-plus me-2"></i> Add Question
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             `;
            
//             $('#formSections').append(sectionHtml);
//             currentSectionIndex++;
//             toggleEmptyContainers();
//             $('#addSectionModal').modal('hide');
//         });
        
//         // Remove section
//         $(document).on('click', '.remove-section-btn', function() {
//             const sectionItem = $(this).closest('.form-section-item');
            
//             // Show confirmation modal
//             $('#confirmationMessage').text('Are you sure you want to remove this section? All questions in this section will also be removed.');
//             $('#confirmationModal').modal('show');
            
//             $('#confirmActionBtn').off('click').on('click', function() {
//                 sectionItem.remove();
//                 toggleEmptyContainers();
//                 $('#confirmationModal').modal('hide');
                
//                 // Renumber remaining sections
//                 $('#formSections .form-section-item').each(function(index) {
//                     $(this).attr('data-section-index', index);
//                     $(this).find('h5.mb-0').text(`Section ${index + 1}`);
                    
//                     // Update input names
//                     $(this).find('input[name^="sections["]').each(function() {
//                         const oldName = $(this).attr('name');
//                         const newName = oldName.replace(/sections\[\d+\]/, `sections[${index}]`);
//                         $(this).attr('name', newName);
//                     });
                    
//                     $(this).find('textarea[name^="sections["]').each(function() {
//                         const oldName = $(this).attr('name');
//                         const newName = oldName.replace(/sections\[\d+\]/, `sections[${index}]`);
//                         $(this).attr('name', newName);
//                     });
                    
//                     // Update question indices
//                     $(this).find('.question-item').each(function(qIndex) {
//                         $(this).attr('data-question-index', qIndex);
//                         $(this).find('h6.mb-0').text(`Question ${qIndex + 1}`);
                        
//                         // Update question input names
//                         $(this).find('input[name^="sections["]').each(function() {
//                             const oldName = $(this).attr('name');
//                             const newName = oldName.replace(/sections\[\d+\]\[questions\]\[\d+\]/, `sections[${index}][questions][${qIndex}]`);
//                             $(this).attr('name', newName);
//                         });
                        
//                         $(this).find('select[name^="sections["]').each(function() {
//                             const oldName = $(this).attr('name');
//                             const newName = oldName.replace(/sections\[\d+\]\[questions\]\[\d+\]/, `sections[${index}][questions][${qIndex}]`);
//                             $(this).attr('name', newName);
//                         });
                        
//                         $(this).find('textarea[name^="sections["]').each(function() {
//                             const oldName = $(this).attr('name');
//                             const newName = oldName.replace(/sections\[\d+\]\[questions\]\[\d+\]/, `sections[${index}][questions][${qIndex}]`);
//                             $(this).attr('name', newName);
//                         });
//                     });
//                 });
                
//                 currentSectionIndex = $('#formSections .form-section-item').length;
//             });
//         });
        
//         // ----- QUESTION HANDLING -----
//         // Show/hide options based on question type
//         $(document).on('change', '.question-type, #questionType', function() {
//             const questionType = $(this).val();
//             const optionsContainer = $(this).closest('.card-body, .modal-body').find('.question-options, #questionOptionsContainer');
            
//             if (['mcq', 'dropdown', 'rating'].includes(questionType)) {
//                 optionsContainer.show();
//             } else {
//                 optionsContainer.hide();
//             }
//         });
        
//         // Initialize options display on page load
//         $('.question-type').each(function() {
//             const questionType = $(this).val();
//             const optionsContainer = $(this).closest('.card-body').find('.question-options');
            
//             if (['mcq', 'dropdown', 'rating'].includes(questionType)) {
//                 optionsContainer.show();
//             } else {
//                 optionsContainer.hide();
//             }
//         });
        
//         // Add question button (open modal)
//         $(document).on('click', '.add-question-btn', function() {
//             const sectionIndex = $(this).closest('.form-section-item').data('section-index');
//             $('#sectionIndexForQuestion').val(sectionIndex);
            
//             // Reset form
//             $('#questionText').val('');
//             $('#questionType').val('rating');
//             $('#questionRequired').prop('checked', false);
//             $('#questionOptions').val('');
            
//             // Show/hide options based on initial type
//             const questionType = $('#questionType').val();
//             if (['mcq', 'dropdown', 'rating'].includes(questionType)) {
//                 $('#questionOptionsContainer').show();
//             } else {
//                 $('#questionOptionsContainer').hide();
//             }
            
//             $('#addQuestionModal').modal('show');
//         });
        
//         // Save new question
//         $('#saveQuestionBtn').click(function() {
//             const sectionIndex = $('#sectionIndexForQuestion').val();
//             const questionText = $('#questionText').val();
//             if (!questionText) return;
            
//             const questionType = $('#questionType').val();
//             const isRequired = $('#questionRequired').is(':checked');
//             const options = $('#questionOptions').val();
            
//             // Find the section and its questions
//             const sectionContainer = $(`.form-section-item[data-section-index="${sectionIndex}"]`);
//             const questionsContainer = sectionContainer.find('.section-questions');
            
//             // Find current question index for this section
//             const currentQuestionIndex = questionsContainer.find('.question-item').length;
            
//             // Hide empty message if exists
//             questionsContainer.find('.section-empty-questions').hide();
            
//             // Create question HTML
//             const questionHtml = `
//                 <div class="question-item card mb-3" data-question-index="${currentQuestionIndex}">
//                     <div class="card-header bg-light d-flex justify-content-between align-items-center">
//                         <h6 class="mb-0">Question ${currentQuestionIndex + 1}</h6>
//                         <button type="button" class="btn btn-sm btn-outline-danger remove-question-btn">
//                             <i class="fas fa-times"></i>
//                         </button>
//                     </div>
//                     <div class="card-body">
//                         <div class="mb-3">
//                             <label class="form-label">Question Text</label>
//                             <input type="text" class="form-control"
//                                 name="sections[${sectionIndex}][questions][${currentQuestionIndex}][questionText]"
//                                 value="${questionText}" required>
//                         </div>
//                         <div class="row">
//                             <div class="col-md-6 mb-3">
//                                 <label class="form-label">Question Type</label>
//                                 <select class="form-select question-type"
//                                     name="sections[${sectionIndex}][questions][${currentQuestionIndex}][questionType]">
//                                     <option value="rating" ${questionType === 'rating' ? 'selected' : ''}>Rating</option>
//                                     <option value="yes_no" ${questionType === 'yes_no' ? 'selected' : ''}>Yes/No</option>
//                                     <option value="mcq" ${questionType === 'mcq' ? 'selected' : ''}>Multiple Choice</option>
//                                     <option value="text" ${questionType === 'text' ? 'selected' : ''}>Text</option>
//                                     <option value="grid" ${questionType === 'grid' ? 'selected' : ''}>Grid</option>
//                                     <option value="dropdown" ${questionType === 'dropdown' ? 'selected' : ''}>Dropdown</option>
//                                     <option value="date" ${questionType === 'date' ? 'selected' : ''}>Date</option>
//                                 </select>
//                             </div>
//                             <div class="col-md-6 mb-3">
//                                 <div class="form-check mt-4">
//                                     <input class="form-check-input" type="checkbox"
//                                         name="sections[${sectionIndex}][questions][${currentQuestionIndex}][required]"
//                                         value="true" ${isRequired ? 'checked' : ''}>
//                                     <label class="form-check-label">Required</label>
//                                 </div>
//                             </div>
//                         </div>
                        
//                         <div class="question-options" style="display: ${['mcq', 'dropdown', 'rating'].includes(questionType) ? 'block' : 'none'};">
//                             <div class="mb-3">
//                                 <label class="form-label">Options (comma separated)</label>
//                                 <textarea class="form-control"
//                                     name="sections[${sectionIndex}][questions][${currentQuestionIndex}][options]"
//                                     rows="3">${options}</textarea>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             `;
            
//             // Append before the "Add Question" button
//             const addQuestionBtn = questionsContainer.find('.add-question-btn');
//             addQuestionBtn.before(questionHtml);
            
//             $('#addQuestionModal').modal('hide');
//         });
        
//         // Remove question
//         $(document).on('click', '.remove-question-btn', function() {
//             const questionItem = $(this).closest('.question-item');
//             const sectionContainer = $(this).closest('.form-section-item');
//             const sectionIndex = sectionContainer.data('section-index');
            
//             // Show confirmation
//             $('#confirmationMessage').text('Are you sure you want to remove this question?');
//             $('#confirmationModal').modal('show');
            
//             $('#confirmActionBtn').off('click').on('click', function() {
//                 questionItem.remove();
                
//                 // If no questions left, show empty message
//                 const questionsContainer = sectionContainer.find('.section-questions');
//                 if (questionsContainer.find('.question-item').length === 0) {
//                     questionsContainer.find('.section-empty-questions').show();
//                 }
                
//                 // Renumber remaining questions in this section
//                 questionsContainer.find('.question-item').each(function(index) {
//                     $(this).attr('data-question-index', index);
//                     $(this).find('h6.mb-0').text(`Question ${index + 1}`);
                    
//                     // Update input names
//                     $(this).find('input[name^="sections["]').each(function() {
//                         const oldName = $(this).attr('name');
//                         const newName = oldName.replace(/sections\[\d+\]\[questions\]\[\d+\]/, `sections[${sectionIndex}][questions][${index}]`);
//                         $(this).attr('name', newName);
//                     });
                    
//                     $(this).find('select[name^="sections["]').each(function() {
//                         const oldName = $(this).attr('name');
//                         const newName = oldName.replace(/sections\[\d+\]\[questions\]\[\d+\]/, `sections[${sectionIndex}][questions][${index}]`);
//                         $(this).attr('name', newName);
//                     });
                    
//                     $(this).find('textarea[name^="sections["]').each(function() {
//                         const oldName = $(this).attr('name');
//                         const newName = oldName.replace(/sections\[\d+\]\[questions\]\[\d+\]/, `sections[${sectionIndex}][questions][${index}]`);
//                         $(this).attr('name', newName);
//                     });
//                 });
                
//                 $('#confirmationModal').modal('hide');
//             });
//         });
        
//         // ----- FORM SUBMISSION -----
//         $('#editFormForm').submit(function(e) {
//             e.preventDefault();
            
//             // Collect form data
//             const formData = $(this).serialize();
            
//             // Submit via AJAX
//             $.ajax({
//                 url: '/admin/forms/update',
//                 type: 'POST',
//                 data: formData,
//                 success: function(response) {
//                     if (response.success) {
//                         showToast('successToast', 'Form updated successfully!');
                        
//                         // Redirect after a short delay
//                         setTimeout(function() {
//                             window.location.href = '/admin/forms';
//                         }, 1500);
//                     } else {
//                         showToast('errorToast', response.message || 'An error occurred while updating the form');
//                     }
//                 },
//                 error: function(xhr, status, error) {
//                     showToast('errorToast', 'Server error: ' + error);
//                 }
//             });
//         });
        
//         // ----- UTILITY FUNCTIONS -----
//         // Show toast messages
//         function showToast(toastId, message) {
//             const toast = document.getElementById(toastId);
//             if (toast) {
//                 const toastBody = toast.querySelector('.toast-body');
//                 if (toastBody) {
//                     toastBody.textContent = message;
//                 }
//                 const bsToast = new bootstrap.Toast(toast);
//                 bsToast.show();
//             }
//         }
        
//         // Confirmation modal for dangerous actions
//         $('#cancelActionBtn').click(function() {
//             $('#confirmationModal').modal('hide');
//         });
        
//         // Initialize any existing questions
//         $('.question-type').trigger('change');
//     });
//     </script>
//     </body>
//     </html>