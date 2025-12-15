const PDFDocument = require('pdfkit');
const Student = require('../../models/CoreUser/Student');
const StudentMarks = require('../../models/Attendance_PerformanceSchema/StudentMarks');
const Subject = require('../../models/AcademicSchema/Subject');
const Parent = require('../../models/CoreUser/Parent');
const AssignmentSubmission = require('../../models/AcademicSchema/AssignmentSubmission');
const { sendEmailWithAttachment } = require('../../utils/email');

// exports.generateReportCard = async (req, res) => {
//   try {
//     const { studentId } = req.params;

//     const student = await Student.findById(studentId).populate('class_id');
//     if (!student) return res.status(404).json({ message: 'Student not found' });

//     const submissions = await AssignmentSubmission.find({ student_id: studentId })
//       .populate('assignment_id')
//       .populate('assignment_id.subject_id', 'name');

//     const doc = new PDFDocument({ margin: 40 });
//     let filename = `${student.full_name}_report_card.pdf`;
//     filename = encodeURIComponent(filename);

//     // Set response headers
//     res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
//     res.setHeader('Content-type', 'application/pdf');

//     // Pipe PDF to response
//     doc.pipe(res);

//     // Header
//     doc.fontSize(20).text('📘 Report Card', { align: 'center' });
//     doc.moveDown();

//     // Student Info
//     doc.fontSize(12).text(`Name: ${student.full_name}`);
//     doc.text(`Class: ${student.class_id.name}`);
//     doc.text(`Admission No: ${student.admission_number}`);
//     doc.text(`Generated At: ${new Date().toLocaleDateString()}`);
//     doc.moveDown();

//     // Table Header
//     doc.fontSize(14).text('Subject-wise Grades', { underline: true });
//     doc.moveDown(0.5);
//     doc.fontSize(12);

//     submissions.forEach((sub, index) => {
//       const subject = sub.assignment_id.subject_id?.name || 'Unknown';
//       doc.text(`${index + 1}. ${subject} - Grade: ${sub.grade || 'N/A'} | Remarks: ${sub.remarks || '-'}`);
//     });

//     doc.end();
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to generate report card' });
//   }
// };
exports.generateReportCard = async (req, res) => {
  const { studentId, examId } = req.params;
  try {
    const marks = await StudentMarks.find({ student_id: studentId, exam_id: examId })
      .populate('subject_id');

    if (!marks.length) return res.status(404).json({ message: 'No marks found' });

    const student = await Student.findById(studentId).populate('class_id');
    const total = marks.reduce((sum, m) => sum + m.marks_obtained, 0);
    const maxTotal = marks.reduce((sum, m) => sum + m.max_marks, 0);
    const percentage = ((total / maxTotal) * 100).toFixed(2);

    res.json({
      student: {
        name: student.full_name,
        class: student.class_id.class_name,
      },
      exam_id: examId,
      percentage,
      subjects: marks.map(m => ({
        subject: m.subject_id.subject_name,
        marks: m.marks_obtained,
        max: m.max_marks,
        grade: m.grade || '',
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.generateAndEmailReportCard = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate(['class_id', 'parent_id']);
    const submissions = await AssignmentSubmission.find({ student_id: studentId })
      .populate('assignment_id');

    if (!student || !student.parent_id) {
      return res.status(404).json({ message: 'Student or parent not found' });
    }

    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      await sendEmailWithAttachment({
        to: student.parent_id.email,
        subject: `Report Card for ${student.full_name}`,
        text: `Attached is the report card for ${student.full_name}.`,
        filename: `ReportCard-${student.full_name}.pdf`,
        buffer: pdfData,
      });

      res.status(200).json({ message: 'Report card generated and emailed' });
    });

    
    doc.fontSize(16).text('📘 Student Report Card', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${student.full_name}`);
    doc.text(`Admission No: ${student.admission_number}`);
    doc.text(`Class: ${student.class_id.name}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown().text('Grades:', { underline: true });

    submissions.forEach((s, i) => {
      doc.text(`${i + 1}. Subject: ${s.assignment_id.subject_id} — Grade: ${s.grade || 'N/A'}`);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};