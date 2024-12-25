import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
  {
    teams: [
      {
        name: { type: String, required: true },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    platformSettings: {
      integrations: [{ type: String }],
      globalNotifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
