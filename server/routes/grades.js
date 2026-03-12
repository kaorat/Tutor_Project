import express from 'express';
import { body, validationResult } from 'express-validator';
import { z } from 'zod';
import Grade from '../models/Grade.js';
import protect from '../middleware/auth.js';
import { resolveTutorId } from '../middleware/auth.js';

const router = express.Router();

// F5.4: Zod server-side validation schema
const gradeCreateSchema = z.object({
  student: z.string().min(1, 'Student is required'),
  classId: z.string().min(1, 'Class is required'),
  assessmentName: z.string().min(1, 'Assessment name is required'),
  score: z.number({ coerce: true }).min(0, 'Score must be >= 0'),
  maxScore: z.number({ coerce: true }).min(1, 'Max score must be >= 1'),
});

// 6_1: Add grade — F5.4: Zod + express-validator
router.post('/', protect, [
  body('student').notEmpty().withMessage('Student is required'),
  body('classId').notEmpty().withMessage('Class is required'),
  body('assessmentName').trim().notEmpty().withMessage('Assessment name is required'),
  body('score').isNumeric().withMessage('Score must be a number'),
  body('maxScore').isNumeric().withMessage('Max score must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // F5.4: Zod server-side validation
    const zodResult = gradeCreateSchema.safeParse(req.body);
    if (!zodResult.success) {
      return res.status(400).json({ errors: zodResult.error.issues.map(e => ({ msg: e.message, path: e.path.join('.') })) });
    }

    const grade = new Grade({ ...req.body, tutor: resolveTutorId(req) });
    await grade.save();
    const populated = await Grade.findById(grade._id)
      .populate('student', 'firstName lastName studentId')
      .populate('classId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 6_2: View grade list
router.get('/', protect, async (req, res) => {
  try {
    const { classId, student, assessmentType, minScore, maxScore } = req.query;
    const query = { tutor: resolveTutorId(req) };
    if (classId) query.classId = classId;
    if (student) query.student = student;
    if (assessmentType) query.assessmentType = assessmentType;
    // F4.4: Advanced score range filtering
    if (minScore !== undefined || maxScore !== undefined) {
      query.score = {};
      if (minScore !== undefined) query.score.$gte = Number(minScore);
      if (maxScore !== undefined) query.score.$lte = Number(maxScore);
    }

    const grades = await Grade.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('classId', 'name')
      .sort({ date: -1 });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 6_3: View student grade details
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId, tutor: resolveTutorId(req) })
      .populate('classId', 'name')
      .sort({ date: -1 });

    const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
    const totalMax = grades.reduce((sum, g) => sum + g.maxScore, 0);
    const average = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : 0;

    res.json({ grades, summary: { totalScore, totalMax, average, count: grades.length } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 6_4: Edit grade
router.put('/:id', protect, async (req, res) => {
  try {
    const grade = await Grade.findOneAndUpdate(
      { _id: req.params.id, tutor: resolveTutorId(req) },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('student', 'firstName lastName studentId')
      .populate('classId', 'name');
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    res.json(grade);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 6_5: Delete grade
router.delete('/:id', protect, async (req, res) => {
  try {
    const grade = await Grade.findOneAndDelete({ _id: req.params.id, tutor: resolveTutorId(req) });
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
