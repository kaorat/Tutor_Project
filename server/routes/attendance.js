import express from 'express';
import Attendance from '../models/Attendance.js';
import auth from '../middleware/auth.js';
import { resolveTutorId } from '../middleware/auth.js';

const router = express.Router();

// 5_1: Take attendance
router.post('/', auth, async (req, res) => {
  try {
    const { schedule, classId, date, records } = req.body;
    if (!schedule || !classId || !date || !records) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Attendance.findOne({ schedule, tutor: resolveTutorId(req) });
    if (existing) {
      existing.records = records;
      await existing.save();
      const populated = await Attendance.findById(existing._id)
        .populate('schedule', 'startTime endTime topic')
        .populate('classId', 'name')
        .populate('records.student', 'firstName lastName studentId');
      return res.json(populated);
    }

    const attendance = new Attendance({ schedule, classId, date, records, tutor: resolveTutorId(req) });
    await attendance.save();
    const populated = await Attendance.findById(attendance._id)
      .populate('schedule', 'startTime endTime topic')
      .populate('classId', 'name')
      .populate('records.student', 'firstName lastName studentId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 5_2: View attendance list
router.get('/', auth, async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const query = { tutor: resolveTutorId(req) };
    if (classId) query.classId = classId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendances = await Attendance.find(query)
      .populate('schedule', 'startTime endTime topic date')
      .populate('classId', 'name')
      .populate('records.student', 'firstName lastName studentId')
      .sort({ date: -1 });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 5_3: View attendance details / summary for a student
router.get('/summary/:studentId', auth, async (req, res) => {
  try {
    const attendances = await Attendance.find({
      tutor: resolveTutorId(req),
      'records.student': req.params.studentId
    }).populate('classId', 'name').populate('schedule', 'date topic');

    let present = 0, absent = 0, late = 0, excused = 0;
    attendances.forEach(a => {
      const record = a.records.find(r => r.student.toString() === req.params.studentId);
      if (record) {
        if (record.status === 'present') present++;
        else if (record.status === 'absent') absent++;
        else if (record.status === 'late') late++;
        else if (record.status === 'excused') excused++;
      }
    });

    res.json({ total: attendances.length, present, absent, late, excused, attendances });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 5_4: Edit attendance
router.put('/:id', auth, async (req, res) => {
  try {
    const attendance = await Attendance.findOneAndUpdate(
      { _id: req.params.id, tutor: resolveTutorId(req) },
      { records: req.body.records },
      { new: true }
    )
      .populate('schedule', 'startTime endTime topic')
      .populate('classId', 'name')
      .populate('records.student', 'firstName lastName studentId');
    if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 5_5: Delete attendance record
router.delete('/:id', auth, async (req, res) => {
  try {
    const attendance = await Attendance.findOneAndDelete({ _id: req.params.id, tutor: resolveTutorId(req) });
    if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
