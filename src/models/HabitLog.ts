// src/models/HabitLog.ts
import mongoose from 'mongoose';

const HabitLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    taskName: { type: String, required: true },
    duration: { type: Number, required: true }, // Duration in minutes
    breaks: { type: Number, default: 0 }, // Number of breaks
    distractions: { type: Number, default: 0 }, // Number of distractions
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.HabitLog || mongoose.model('HabitLog', HabitLogSchema);
