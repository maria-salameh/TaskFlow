import mongoose from 'mongoose';
import { HABIT_FREQUENCIES } from '../validators/habitValidator.js';

// Bonus B2 : seconde entité métier
const habitSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    frequency: { type: String, enum: HABIT_FREQUENCIES, required: true },
    active: { type: Boolean, default: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
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

export const Habit = mongoose.model('Habit', habitSchema);
