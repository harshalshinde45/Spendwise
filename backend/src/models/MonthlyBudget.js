import mongoose from 'mongoose';
import { MAX_AMOUNT_PAISE } from '../utils/validation.js';

const monthlyBudgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    month: {
      type: String,
      required: [true, 'month is required'],
      match: [/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format'],
      trim: true,
    },
    amountPaise: {
      type: Number,
      required: [true, 'amountPaise is required'],
      min: [0, 'amountPaise cannot be negative'],
      max: [MAX_AMOUNT_PAISE, `amountPaise cannot exceed ${MAX_AMOUNT_PAISE}`],
      validate: {
        validator: Number.isInteger,
        message: 'amountPaise must be an integer minor unit (no fractions)',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
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

// Enforce single budget per month per user
monthlyBudgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export const MonthlyBudget =
  mongoose.models.MonthlyBudget || mongoose.model('MonthlyBudget', monthlyBudgetSchema);
