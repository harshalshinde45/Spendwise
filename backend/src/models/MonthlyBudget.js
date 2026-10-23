import mongoose from 'mongoose';
import { MAX_AMOUNT_PAISE } from '../utils/validation.js';

const monthlyBudgetSchema = new mongoose.Schema(
  {
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
    // Future user identifier placeholder when multi-user authentication is introduced
    userId: {
      type: String,
      default: null,
      index: true,
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

// Enforce single budget per month
monthlyBudgetSchema.index({ month: 1 }, { unique: true });

export const MonthlyBudget =
  mongoose.models.MonthlyBudget || mongoose.model('MonthlyBudget', monthlyBudgetSchema);
