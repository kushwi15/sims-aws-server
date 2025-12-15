const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require("path");
const fs = require("fs");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'school/teachers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const storage1 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "user_avatars",
    allowed_formats: ["jpg", "png"],
  },
});

const storage2 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'parents',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const storage3 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'school_classes',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }],
  },
});

const storage4 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "assignments",
    allowed_formats: ["pdf", "jpg", "png"],
  },
});

const storage5 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'school_timetables',
    allowed_formats: ['pdf', 'png', 'jpg'],
    resource_type: 'auto',
  },
});

const storage6 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'student_attendance',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
  },
});

const storage7 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teacher_attendance_docs',
    allowed_formats: ['jpg', 'png', 'pdf'],
  },
});

const storage8 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "exam_syllabus",
    allowed_formats: ["pdf", "jpg", "png"],
    resource_type: "auto",
  },
});

const storage9 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "grades_remarks",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const storage10 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "school_events",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const storage11 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "notifications",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "pdf"],
  },
});

const storage12 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'homework_attachments',
    allowed_formats: ['jpg', 'png', 'pdf', 'docx'],
    public_id: (req, file) => `assignment-${Date.now()}`,
  },
});

const storage13 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "fees_receipts",
    allowed_formats: ["jpg", "png", "pdf"],
  },
});


const storage14 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "inventory",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const storage15 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "leave_documents",
    allowed_formats: ["jpg", "png", "pdf"],
  },
});

const storage16 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "books",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const storage17 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "buses",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const storage18 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'driver_profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => `driver_${Date.now()}`
  }
});

const storage19 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "transport_docs",
    allowed_formats: ["jpg", "png", "pdf"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});
const storage20 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hostels',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const storage21 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hostel_rooms',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  },
});
const storage22 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "emergency_contacts",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  },
});

const storage23 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hostel_attendance',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf']
  }
});
const storage24 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "salary_payments",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  },
});
const storage25 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "salary_slips",
    resource_type: "raw", // for PDF files
    format: async (req, file) => "pdf",
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});
const storage26 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'exam_halls',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});
const storage27 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'seat_allocations',
    allowed_formats: ['jpg', 'png', 'pdf'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }],
  },
});


// For profile image (single file)
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teachers/profile',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});
const studentProfileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'students/profile',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});
// For certificates (multiple files)
const certificateStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teachers/certificates',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
  },
});
const parentProfileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'parents/profile',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});
const adminStaffProfileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'admin_staff/profile',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});
const proofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'attendance/proof',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});
const teacherProofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teacher_attendance',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
  },
});
const homeworkFileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'homework_attachments',
    allowed_formats: ['pdf', 'docx', 'jpg', 'jpeg', 'png'],
  },
});
const homeworkSubmissionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'homework_submissions',
    allowed_formats: ['pdf', 'docx', 'jpg', 'jpeg', 'png'],
  },
});
const assignmentFileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'assignments',
    allowed_formats: ['pdf', 'docx', 'jpg', 'jpeg', 'png'],
  },
});
const assignmentSubmissionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'assignments_submissions',
    allowed_formats: ['pdf', 'docx', 'jpg', 'jpeg', 'png'],
  },
});

const messageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/messages/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  cb(null, true); // Optionally filter file types
};

const bankInfoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bank_info',
    allowed_formats: ['pdf', 'docx', 'jpg', 'jpeg', 'png'],
    resource_type: "auto",
  },
});

const upload = multer({
  storage, storage1, storage2, storage3, storage4, storage5, storage6, storage7, storage8, storage9,
  storage10, storage11, storage12, storage13, storage14, storage15, storage16, storage17, storage18, storage19,
  storage20, storage21, storage22, storage23, storage24, storage25, storage26, storage27, profileStorage, certificateStorage,
  studentProfileStorage
});

const uploadProfile = multer({ storage: profileStorage });
const uploadStudentProfile = multer({ storage: studentProfileStorage });
const uploadStudentDocuments = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'students/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});
const uploadCertificate = multer({ storage: certificateStorage });
const uploadParentProfile = multer({ storage: parentProfileStorage });
const uploadAdminStaffProfile = multer({ storage: adminStaffProfileStorage });
const uploadProof = multer({ storage: proofStorage });
const uploadTeacherProof = multer({ storage: teacherProofStorage });
const uploadHomeworkFile = multer({ storage: homeworkFileStorage });
const uploadHomeworkSubmission = multer({ storage: homeworkSubmissionStorage });
const uploadAssignmentFile = multer({ storage: assignmentFileStorage });
const uploadAssignmentSubmission = multer({ storage: assignmentSubmissionStorage });
const uploadMessageStorage = multer({ messageStorage, fileFilter });
const uploadBankInfoStorage = multer({ storage: bankInfoStorage });


module.exports = {
  upload, uploadProfile, uploadStudentProfile, uploadCertificate, uploadParentProfile, uploadAdminStaffProfile,
  uploadProof, uploadTeacherProof, uploadHomeworkFile, uploadHomeworkSubmission, uploadAssignmentFile, uploadAssignmentSubmission,
  uploadMessageStorage, uploadBankInfoStorage, uploadStudentDocuments
};
