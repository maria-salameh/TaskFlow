import mongoose from 'mongoose';
import { TASK_PRIORITIES, TASK_STATUSES } from '../validators/taskValidator.js';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    description: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: TASK_STATUSES, required: true },
    // Date civile "YYYY-MM-DD" stockée telle quelle : pas de décalage de fuseau horaire
    dueDate: { type: String, default: null },
    // Bonus B1
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    // Bonus B3 (heatmap) : instant où la tâche est passée à "done", géré uniquement par le serveur
    completedAt: { type: Date, default: null },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      // Le contrat public expose "id" (chaîne) et pas "_id"
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.ownerId = ret.ownerId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

taskSchema.index({ ownerId: 1, completedAt: 1 });

export const Task = mongoose.model('Task', taskSchema);
