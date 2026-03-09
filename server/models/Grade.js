import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  assessmentName: { type: String, required: true, trim: true },
  assessmentType: { type: String, enum: ['quiz', 'exam', 'homework', 'project', 'participation'], default: 'quiz' },
  score: { type: Number, required: true, min: 0 },
  maxScore: { type: Number, required: true, default: 100, min: 1 },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// F4.5: Virtual field percentage
gradeSchema.virtual('percentage').get(function() {
  return this.maxScore > 0 ? ((this.score / this.maxScore) * 100).toFixed(1) : 0;
});

gradeSchema.set('toJSON', { virtuals: true });
gradeSchema.set('toObject', { virtuals: true });

export default mongoose.model('Grade', gradeSchema);
