import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { z } from 'zod';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import protect from '../middleware/auth.js';
import { restrictTo, resolveTutorId } from '../middleware/auth.js';

const router = express.Router();

// F5.4: Zod server-side validation schemas
const studentCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').regex(/^[a-zA-Z\u0E00-\u0E7F\s]+$/, 'Letters only'),
  lastName: z.string().min(1, 'Last name is required').regex(/^[a-zA-Z\u0E00-\u0E7F\s]+$/, 'Letters only'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  grade: z.string().optional(),
  school: z.string().optional(),
  university: z.array(z.string()).max(3, 'Maximum 3 programs').optional(),
});

// Add student — F5.4: Zod + express-validator dual validation
router.post('/', protect, [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // F5.4: Zod server-side validation
    const zodResult = studentCreateSchema.safeParse(req.body);
    if (!zodResult.success) {
      return res.status(400).json({ errors: zodResult.error.errors.map(e => ({ msg: e.message, path: e.path.join('.') })) });
    }

    const student = new Student({ ...req.body, tutor: resolveTutorId(req) });
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Student ID already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

// View student list with search, filter, pagination, multi-tag search ($all) (F4.4)
router.get('/', protect, async (req, res) => {
  try {
    const { search, status, tags, page = 1, limit = 50 } = req.query;
    const query = { tutor: resolveTutorId(req) };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    // F4.4: Multi-tag search with $all
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query.tags = { $all: tagArray };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Student.countDocuments(query);
    res.json({
      students,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      metadata: { query: search || '', filters: { status, tags }, pagination: { skip, limit: parseInt(limit) } }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// F4.2: Trash - list soft-deleted students
router.get('/trash', protect, async (req, res) => {
  try {
    const students = await Student.find({ tutor: resolveTutorId(req), isDeleted: true });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get top students by XP (leaderboard) — must be above /:id
router.get('/leaderboard/xp', protect, async (req, res) => {
  try {
    const students = await Student.find({ tutor: resolveTutorId(req), isDeleted: false })
      .sort({ xp: -1 })
      .limit(10)
      .select('firstName lastName studentId xp');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// View student details
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, tutor: resolveTutorId(req) });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit student
router.put('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, tutor: resolveTutorId(req) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// F4.2: Soft delete (instead of hard delete) — F5.4: restrictTo('tutor') demonstrates middleware order
router.delete('/:id', protect, restrictTo('tutor', 'admin'), async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, tutor: resolveTutorId(req) },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student moved to trash', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// F4.2: Restore soft-deleted student
router.patch('/:id/restore', protect, async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, tutor: resolveTutorId(req), isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found in trash' });
    res.json({ message: 'Student restored', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// F4.4: ACID Transaction — enrollment with session, commit/abort
router.post('/:id/enroll/:classId', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const student = await Student.findOne({ _id: req.params.id, tutor: resolveTutorId(req) }).session(session);
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Student not found' });
    }

    const cls = await Class.findById(req.params.classId).session(session);
    if (!cls) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Class not found' });
    }

    // Capacity validation inside transaction
    if (cls.students.length >= cls.capacity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Class is at full capacity' });
    }

    // Multi-document update within transaction
    await Class.findByIdAndUpdate(
      req.params.classId,
      { $addToSet: { students: student._id }, $inc: { enrollmentCount: 1 } },
      { session }
    );
    student.enrolledClass = cls._id;
    await student.save({ session });

    await session.commitTransaction();
    session.endSession();

    const updated = await Class.findById(req.params.classId).populate('students');
    res.json({ message: 'Student enrolled', class: updated });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Server error' });
  }
});

// Award XP to a student
router.post('/:id/xp', protect, [
  body('amount').isInt({ min: 1, max: 500 }).withMessage('XP must be 1-500'),
  body('reason').trim().notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const student = await Student.findOne({ _id: req.params.id, tutor: resolveTutorId(req) });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.xp = (student.xp || 0) + req.body.amount;
    await student.save();
    res.json({ message: `+${req.body.amount} XP awarded`, student });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
