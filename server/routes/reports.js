import express from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Schedule from '../models/Schedule.js';
import Attendance from '../models/Attendance.js';
import Grade from '../models/Grade.js';
import protect from '../middleware/auth.js';
import { resolveTutorId } from '../middleware/auth.js';

const router = express.Router();

// 7_1: Dashboard overview
router.get('/overview', protect, async (req, res) => {
  try {
    const tutorId = resolveTutorId(req);
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [totalStudents, activeStudents, totalClasses, activeClasses, todaySchedules, totalSchedules] = await Promise.all([
      Student.countDocuments({ tutor: tutorId }),
      Student.countDocuments({ tutor: tutorId, status: 'active' }),
      Class.countDocuments({ tutor: tutorId }),
      Class.countDocuments({ tutor: tutorId, status: 'active' }),
      Schedule.countDocuments({ tutor: tutorId, date: { $gte: startOfDay, $lt: endOfDay } }),
      Schedule.countDocuments({ tutor: tutorId })
    ]);

    const todayClasses = await Schedule.find({
      tutor: tutorId,
      date: { $gte: startOfDay, $lt: endOfDay }
    }).populate('classId', 'name subject level room').sort({ startTime: 1 });

    res.json({
      totalStudents, activeStudents, totalClasses, activeClasses,
      todaySchedules, totalSchedules, todayClasses
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 7_2: Student progress report
router.get('/student-progress/:studentId', protect, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const tutorId = resolveTutorId(req);

    const [grades, attendances] = await Promise.all([
      Grade.find({ student: studentId, tutor: tutorId }).populate('classId', 'name').sort({ date: 1 }),
      Attendance.find({ tutor: tutorId, 'records.student': studentId }).populate('classId', 'name').sort({ date: 1 })
    ]);

    const gradeProgress = grades.map(g => ({
      date: g.date,
      assessment: g.assessmentName,
      score: g.score,
      maxScore: g.maxScore,
      percentage: g.percentage,
      class: g.classId?.name
    }));

    let present = 0, absent = 0, late = 0, excused = 0;
    attendances.forEach(a => {
      const record = a.records.find(r => r.student.toString() === studentId);
      if (record) {
        if (record.status === 'present') present++;
        else if (record.status === 'absent') absent++;
        else if (record.status === 'late') late++;
        else if (record.status === 'excused') excused++;
      }
    });

    res.json({ gradeProgress, attendanceSummary: { present, absent, late, excused, total: attendances.length } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 7_3: Attendance report
router.get('/attendance-report', protect, async (req, res) => {
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
      .populate('classId', 'name')
      .populate('records.student', 'firstName lastName studentId')
      .sort({ date: -1 });

    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalExcused = 0;
    attendances.forEach(a => {
      a.records.forEach(r => {
        if (r.status === 'present') totalPresent++;
        else if (r.status === 'absent') totalAbsent++;
        else if (r.status === 'late') totalLate++;
        else if (r.status === 'excused') totalExcused++;
      });
    });

    const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused;

    res.json({
      attendances,
      summary: { totalPresent, totalAbsent, totalLate, totalExcused, totalRecords, sessions: attendances.length }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 7_4: Class summary report
router.get('/class-summary/:classId', protect, async (req, res) => {
  try {
    const classId = req.params.classId;
    const tutorId = resolveTutorId(req);

    const [classDoc, schedules, grades, attendances] = await Promise.all([
      Class.findOne({ _id: classId, tutor: tutorId }).populate('students', 'firstName lastName studentId'),
      Schedule.find({ classId, tutor: tutorId }),
      Grade.find({ classId, tutor: tutorId }).populate('student', 'firstName lastName studentId'),
      Attendance.find({ classId, tutor: tutorId }).populate('records.student', 'firstName lastName studentId')
    ]);

    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    const avgScores = {};
    grades.forEach(g => {
      const sid = g.student?._id?.toString();
      if (!sid) return;
      if (!avgScores[sid]) avgScores[sid] = { student: g.student, total: 0, max: 0, count: 0 };
      avgScores[sid].total += g.score;
      avgScores[sid].max += g.maxScore;
      avgScores[sid].count++;
    });

    const studentSummaries = Object.values(avgScores).map(s => ({
      student: s.student,
      averagePercentage: s.max > 0 ? ((s.total / s.max) * 100).toFixed(1) : 0,
      totalAssessments: s.count
    }));

    res.json({
      class: classDoc,
      totalSchedules: schedules.length,
      completedSchedules: schedules.filter(s => s.status === 'completed').length,
      totalGrades: grades.length,
      totalAttendanceSessions: attendances.length,
      studentSummaries
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 7_5: Export report data (JSON format for client-side export)
router.get('/export', protect, async (req, res) => {
  try {
    const tutorId = resolveTutorId(req);
    const { type, classId } = req.query;

    if (type === 'students') {
      const students = await Student.find({ tutor: tutorId }).sort({ firstName: 1 });
      return res.json({ type: 'students', data: students });
    }
    if (type === 'grades' && classId) {
      const grades = await Grade.find({ classId, tutor: tutorId })
        .populate('student', 'firstName lastName studentId')
        .sort({ date: -1 });
      return res.json({ type: 'grades', data: grades });
    }
    if (type === 'attendance' && classId) {
      const attendances = await Attendance.find({ classId, tutor: tutorId })
        .populate('records.student', 'firstName lastName studentId')
        .sort({ date: -1 });
      return res.json({ type: 'attendance', data: attendances });
    }

    res.status(400).json({ message: 'Invalid export type' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// F4.5: Aggregation pipeline - grade analytics with $group, $avg, $max
router.get('/grade-analytics', protect, async (req, res) => {
  try {
    const tutorId = resolveTutorId(req);

    const analytics = await Grade.aggregate([
      { $match: { tutor: new mongoose.Types.ObjectId(tutorId) } },
      {
        $group: {
          _id: '$classId',
          averageScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' },
          totalAssessments: { $sum: 1 },
          avgPercentage: {
            $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] }
          }
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          className: '$classInfo.name',
          averageScore: { $round: ['$averageScore', 1] },
          maxScore: 1,
          minScore: 1,
          totalAssessments: 1,
          avgPercentage: { $round: ['$avgPercentage', 1] }
        }
      },
      { $sort: { avgPercentage: -1 } }
    ]);

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
