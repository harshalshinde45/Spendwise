import mongoose from 'mongoose';
import { MAX_AMOUNT_PAISE } from '../utils/validation.js';

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      maxlength: [60, 'Goal name cannot exceed 60 characters'],
    },
    targetPaise: {
      type: Number,
      required: [true, 'targetPaise is required'],
      min: [100, 'Target must be at least ₹1 (100 paise)'],
      max: [MAX_AMOUNT_PAISE, `targetPaise cannot exceed ${MAX_AMOUNT_PAISE}`],
      validate: {
        validator: Number.isInteger,
        message: 'targetPaise must be an integer minor unit (no fractions)',
      },
    },
    savedPaise: {
      type: Number,
      default: 0,
      min: [0, 'savedPaise cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'savedPaise must be an integer minor unit (no fractions)',
      },
    },
    targetDate: {
      type: String,
      default: '',
      trim: true,
    },
    personalMessage: {
      type: String,
      default: '',
      trim: true,
      maxlength: [280, 'Personal message cannot exceed 280 characters'],
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    color: {
      type: String,
      default: '#3E6B50',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

goalSchema.index({ userId: 1, createdAt: -1 });

export const Goal = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
