import mongoose from 'mongoose';

// Bonus B2 : événement daté "habitude réalisée tel jour".
// date est une date civile "YYYY-MM-DD" choisie par l'utilisateur dans SON fuseau horaire.
const habitLogSchema = new mongoose.Schema(
  {
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        return { id: ret._id.toString(), habitId: ret.habitId.toString(), date: ret.date };
      },
    },
  },
);

// Une seule réalisation par habitude et par jour
habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });
habitLogSchema.index({ ownerId: 1, date: 1 });

export const HabitLog = mongoose.model('HabitLog', habitLogSchema);
