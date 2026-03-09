import express from 'express';
import { body, validationResult } from 'express-validator';
import Class from '../models/Class.js';
import protect from '../middleware/auth.js';
import { restrictTo, resolveTutorId } from '../middleware/auth.js';

const router = express.Router();

// 3_1: Create class
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Class name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, subject, description, level, room, capacity, students } = req.body;
    const classDoc = new Class({ name, subject, description, level, room, capacity, students, tutor: resolveTutorId(req) });
    await classDoc.save();
    res.status(201).json(classDoc);
  } catch (error) {
    console.error('Class create error:', error.message, error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { tutor: resolveTutorId(req) };
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const classes = await Class.find(query)
      .populate('students', 'firstName lastName studentId')
      .sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 3_3: View class details
router.get('/:id', protect, async (req, res) => {
  try {
    const classDoc = await Class.findOne({ _id: req.params.id, tutor: resolveTutorId(req) })
      .populate('students', 'firstName lastName studentId email phone status');
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });
    res.json(classDoc);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 3_4: Edit class
router.put('/:id', protect, async (req, res) => {
  try {
    const classDoc = await Class.findOneAndUpdate(
      { _id: req.params.id, tutor: resolveTutorId(req) },
      req.body,
      { new: true, runValidators: true }
    ).populate('students', 'firstName lastName studentId');
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });
    res.json(classDoc);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 3_5: Delete class — F5.4: restrictTo demonstrates protect → restrictTo middleware order
router.delete('/:id', protect, restrictTo('tutor', 'admin'), async (req, res) => {
  try {
    const classDoc = await Class.findOneAndDelete({ _id: req.params.id, tutor: resolveTutorId(req) });
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
