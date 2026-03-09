import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true, trim: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
  grade: { type: String, default: '', trim: true },
  school: { type: String, default: '', trim: true },
  parentName: { type: String, default: '', trim: true },
  parentPhone: { type: String, default: '', trim: true },
  notes: { type: String, default: '' },
  university: { type: [String], default: [] },
  tags: [{ type: String, trim: true }],
  xp: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  // F4.2: birthday for age virtual
  birthday: { type: Date, default: null },
  // F4.2: Soft delete fields
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// F4.5: Virtual field fullName
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// F4.2: Virtual field age computed from birthday (not stored in DB)
studentSchema.virtual('age').get(function() {
  if (!this.birthday) return null;
  const diff = Date.now() - new Date(this.birthday).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

// F4.2: Query middleware to filter soft-deleted by default
studentSchema.pre(/^find/, function(next) {
  if (this.getQuery().includeDeleted) {
    delete this.getQuery().includeDeleted;
  } else if (!this.getQuery().hasOwnProperty('isDeleted')) {
    this.where({ isDeleted: false });
  }
  next();
});

// Auto-generate studentId if not provided
studentSchema.pre('save', function(next) {
  if (!this.studentId) {
    this.studentId = `STU-${Date.now().toString(36).toUpperCase()}`;
  }
  next();
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Student', studentSchema);
