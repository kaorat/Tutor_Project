import express from 'express';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Schedule from '../models/Schedule.js';
import Attendance from '../models/Attendance.js';
import Grade from '../models/Grade.js';
import protect from '../middleware/auth.js';
import { restrictTo } from '../middleware/auth.js';

const router = express.Router();

// F5.4: restrictTo('admin') — admin-only routes demonstrating middleware order: protect → restrictTo
// List all tutors (admin only)
router.get('/tutors', protect, restrictTo('admin'), async (req, res) => {
  try {
    const tutors = await User.find({ role: 'tutor' }).select('-password').sort({ createdAt: -1 });

    // Get counts for each tutor
    const tutorsWithStats = await Promise.all(
      tutors.map(async (tutor) => {
        const [studentCount, classCount, scheduleCount] = await Promise.all([
          Student.countDocuments({ tutor: tutor._id, isDeleted: { $ne: true } }),
          Class.countDocuments({ tutor: tutor._id }),
          Schedule.countDocuments({ tutor: tutor._id }),
        ]);
        return {
          ...tutor.toJSON(),
          studentCount,
          classCount,
          scheduleCount,
        };
      })
    );

    res.json(tutorsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific tutor's full performance data (admin only)
router.get('/tutors/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const tutor = await User.findById(req.params.id).select('-password');
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const [students, classes, schedules, grades] = await Promise.all([
      Student.find({ tutor: tutor._id, isDeleted: { $ne: true } }),
      Class.find({ tutor: tutor._id }).populate('students', 'firstName lastName studentId'),
      Schedule.find({ tutor: tutor._id }).populate('classId', 'name subject').sort({ date: -1 }).limit(20),
      Grade.find({ tutor: tutor._id }).populate('student', 'firstName lastName').populate('classId', 'name'),
    ]);

    // Attendance summary
    const attendanceRecords = await Attendance.find({ tutor: tutor._id });
    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalRecords = 0;
    attendanceRecords.forEach(a => {
      a.records?.forEach(r => {
        totalRecords++;
        if (r.status === 'present') totalPresent++;
        else if (r.status === 'absent') totalAbsent++;
        else if (r.status === 'late') totalLate++;
      });
    });

    // Grade average
    const avgGrade = grades.length > 0
      ? (grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length).toFixed(1)
      : 0;

    res.json({
      tutor: tutor.toJSON(),
      stats: {
        studentCount: students.length,
        classCount: classes.length,
        scheduleCount: schedules.length,
        totalGrades: grades.length,
        avgGrade: Number(avgGrade),
        attendance: { totalRecords, totalPresent, totalAbsent, totalLate },
      },
      students,
      classes,
      recentSchedules: schedules,
      recentGrades: grades.slice(0, 20),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
