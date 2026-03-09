import express from 'express';
import { body, validationResult } from 'express-validator';
import Schedule from '../models/Schedule.js';
import protect from '../middleware/auth.js';
import { resolveTutorId } from '../middleware/auth.js';

const router = express.Router();

// 4_1: Create schedule (supports weekly repeat)
router.post('/', protect, [
  body('classId').notEmpty().withMessage('Class is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { repeat, repeatUntil, ...scheduleData } = req.body;
    const tutorId = resolveTutorId(req);

    // Build list of dates (single or weekly repeating)
    const dates = [];
    const startDate = new Date(scheduleData.date);
    dates.push(new Date(startDate));

    if (repeat === 'weekly' && repeatUntil) {
      const endRepeat = new Date(repeatUntil);
      let next = new Date(startDate);
      next.setDate(next.getDate() + 7);
      while (next <= endRepeat) {
        dates.push(new Date(next));
        next.setDate(next.getDate() + 7);
      }
    }

    // Cap at 52 weeks to prevent abuse
    const cappedDates = dates.slice(0, 52);

    const created = [];
    for (const d of cappedDates) {
      const s = new Schedule({ ...scheduleData, date: d, tutor: tutorId });
      await s.save();
      created.push(s);
    }

    // Populate and return all created schedules
    const populated = await Schedule.find({ _id: { $in: created.map(s => s._id) } })
      .populate('classId', 'name subject level room');

    res.status(201).json(populated.length === 1 ? populated[0] : populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 4_2: View today's schedule
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const schedules = await Schedule.find({
      tutor: resolveTutorId(req),
      date: { $gte: start, $lt: end }
    }).populate('classId', 'name subject level room students').sort({ startTime: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 4_2b: View all schedules (with optional date range filter)
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate, classId, status } = req.query;
    const query = { tutor: resolveTutorId(req) };
    if (classId) query.classId = classId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const schedules = await Schedule.find(query)
      .populate('classId', 'name subject level room')
      .sort({ date: -1, startTime: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 4_3: View schedule details
router.get('/:id', protect, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, tutor: resolveTutorId(req) })
      .populate({ path: 'classId', populate: { path: 'students', select: 'firstName lastName studentId' } });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 4_4: Edit schedule
router.put('/:id', protect, async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, tutor: resolveTutorId(req) },
      req.body,
      { new: true, runValidators: true }
    ).populate('classId', 'name subject level room');
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 4_5: Delete schedule
router.delete('/:id', protect, async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, tutor: resolveTutorId(req) });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
