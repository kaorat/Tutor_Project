import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  subject: { type: String, default: 'Physics', trim: true },
  // F4.1: category enum with required validation
  category: { type: String, enum: ['Lecture', 'Lab', 'Tutorial', 'Exam Prep', 'One-on-One', 'Group', 'Online', 'General'], default: 'General', required: true },
  description: { type: String, default: '' },
  level: { type: String, default: '', trim: true },
  room: { type: String, default: '', trim: true },
  capacity: { type: Number, default: 30, min: 1 },
  enrollmentCount: { type: Number, default: 0 },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'inactive', 'completed'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Class', classSchema);
