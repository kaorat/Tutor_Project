import mongoose from 'mongoose';

const MobileSyncSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'synced'], default: 'synced' },
  syncedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('MobileSync', MobileSyncSchema);
