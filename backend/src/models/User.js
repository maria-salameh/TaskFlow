import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // Stocké en minuscules : l'unicité est donc insensible à la casse
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Jamais renvoyé par défaut (select: false) et retiré du JSON
    passwordHash: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        return { id: ret._id.toString(), email: ret.email, createdAt: ret.createdAt };
      },
    },
  },
);

export const User = mongoose.model('User', userSchema);
