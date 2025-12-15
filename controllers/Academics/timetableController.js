const Timetable = require('../../models/AcademicSchema/Timetable');
const PDFDocument = require('pdfkit');
const Class = require('../../models/AcademicSchema/Class');
const mongoose = require('mongoose');


exports.upsertTimetable = async (req, res) => {
  try {
    const { class_id, day, periods } = req.body;

    const timetable = await Timetable.findOneAndUpdate(
      { class_id, day },
      { periods },
      { new: true, upsert: true }
    );

    res.status(200).json(timetable);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getTimetableByClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }
    
    const timetable = await Timetable.find({ class_id: classId })
      .populate('periods.subject_id', 'name')
      .populate('periods.teacher_id', 'full_name')
      .sort({ day: 1 });

    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.exportTimetablePDF = async (req, res) => {
  try {
    const classId = req.params.classId;
    
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }
    
    const timetable = await Timetable.find({ class_id: classId })
      .populate('periods.subject_id', 'name')
      .populate('periods.teacher_id', 'full_name')
      .sort({ day: 1 });

    const classInfo = await Class.findById(classId);
    if (!classInfo) return res.status(404).json({ message: 'Class not found' });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=timetable-${classInfo.class_name}.pdf`);

    doc.fontSize(16).text(`🗓️ Timetable: ${classInfo.class_name}`, { align: 'center' });
    doc.moveDown();

    for (const daySchedule of timetable) {
      doc.fontSize(14).text(`📅 ${daySchedule.day}`, { underline: true });
      doc.moveDown(0.5);
      for (const period of daySchedule.periods) {
        doc.fontSize(12).text(
          `⏰ ${period.start_time} - ${period.end_time} | 📚 ${period.subject_id?.name || 'N/A'} | 👨‍🏫 ${period.teacher_id?.full_name || 'N/A'}`
        );
      }
      doc.moveDown();
    }

    doc.end();
    doc.pipe(res);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export PDF', error: err.message });
  }
};
