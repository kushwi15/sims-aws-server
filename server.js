require("dotenv").config();
require("./jobs/renewalReminder");
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routers/CoreUserRoutes/userRoutes");
const teacherRoutes = require('./routers/CoreUserRoutes/teacherRoutes');
const studentRoutes = require('./routers/CoreUserRoutes/studentRoutes');
const authRoutes = require('./routers/CoreUserRoutes/authRoutes');
const parentRoutes = require('./routers/CoreUserRoutes/parentRoutes');
const adminStaffRoutes = require('./routers/CoreUserRoutes/adminStaffRoutes');
const studentAttendanceRoutes = require('./routers/Attendance_Performance/studentAttendanceRoutes');
const teacherAttendanceRoutes = require('./routers/Attendance_Performance/teacherAttendanceRoutes');
const homeworkRoutes = require('./routers/Communication_Activities/homeworkRoutes');
const homeworkSubmissionRoutes = require('./routers/Communication_Activities/homeworkSubmissionRoutes');
const assignmentRoutes = require('./routers/Academics/assignmentRoutes');
const assignmentSubmissionRoutes = require('./routers/Academics/assignmentSubmissionRoutes');
const reportCardRoutes = require('./routers/Academics/reportCardRoutes');
const classRoutes = require('./routers/Academics/classRoutes');
const timetableRoutes = require('./routers/Academics/timetableRoutes');
const subjectRoutes = require('./routers/Academics/subjectRoutes');
const examRoutes = require('./routers/Attendance_Performance/examRoutes');
const bookRoutes = require('./routers/Library_Management/bookRoutes');
const announcementRoutes = require('./routers/Communication_Activities/announcementRoutes');
const eventRoutes = require('./routers/Communication_Activities/eventRoutes');
const messageRoutes = require('./routers/Communication_Activities/messageRoutes');
const bankRoutes = require('./routers/Administrative/bankRoutes');
const feeRoutes = require('./routers/Administrative/feeRoutes');
const adminRoutes = require('./routers/CoreUserRoutes/adminRoutes');
const otpRoutes = require('./routers/CoreUserRoutes/authOtpRoutes');
const forgotPasswordRoutes = require('./routers/CoreUserRoutes/forgotPasswordRoutes');
const examReports = require('./routers/Attendance_Performance/examReportRoutes');
const resourceRoutes = require('./routers/Library_Management/resourceRoutes');
const teacherScheduleRoutes = require('./routers/Attendance_Performance/teacherScheduleRoutes');
const adminProfileRoutes = require('./routers/CoreUserRoutes/adminProfileRoutes');
const diaryRoutes = require('./routers/CoreUserRoutes/diaryRoutes');
const leaveRoutes = require('./routers/Administrative/leaveRoutes');
const paymentDetailsRoutes = require('./routers/Administrative/paymentDetailsRoutes');
const s3Routes = require('./routers/AwsRoutes/s3Route');
const preSignedUrlRoutes = require('./routers/AwsRoutes/preSignedUrlRoute');



const app = express();
app.use(express.json());
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'capacitor://localhost',
    'http://localhost:8081',
    'https://sims-baseldts.vercel.app',
    'https://sims-frontend-dun.vercel.app',
    'https://sims-client-govt.vercel.app',
    'https://sims-client-bdts-govt.vercel.app',

    // Sai
    'http://40.192.110.75:5000',

    // Kushwinth
    'http://16.171.13.197:5000',
    'https://sims-bdts-aws.vercel.app'
  ],
  credentials: true
}));


app.use("/api/generate-url",preSignedUrlRoutes);
app.use("/api/calculate-size", s3Routes);
app.use("/api/users", userRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/admin-staff', adminStaffRoutes);
app.use('/api/student-attendance', studentAttendanceRoutes);
app.use('/api/teacher-attendance', teacherAttendanceRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/homework-submissions', homeworkSubmissionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/assignment-submissions', assignmentSubmissionRoutes);
app.use('/api/report-cards', reportCardRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exam-schedule', require('./routers/Examination_Scheduling/examScheduleRoutes'));
app.use('/api/marks', require('./routers/Attendance_Performance/studentMarksRoutes'));
// app.use('/api/report-card', require('./routes/reportCardRoutes'));
app.use('/api/books', bookRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/diary', diaryRoutes);
app.use("/api/bank", bankRoutes);
app.use('/api/fees', feeRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/forgot-password", forgotPasswordRoutes);
app.use('/api/exam-reports', examReports);
app.use('/api/resources', resourceRoutes);
app.use('/api/teacher/schedules', teacherScheduleRoutes);
app.use('/api/admin-profile', adminProfileRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payment-details', paymentDetailsRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT,"0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));