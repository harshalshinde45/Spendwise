import mongoose from 'mongoose';
import { ALLOWED_CATEGORIES, MAX_AMOUNT_PAISE, MAX_DESCRIPTION_LENGTH } from '../utils/validation.js';

const expenseSchema = new mongoose.Schema(
  {
    amountPaise: {
      type: Number,
      required: [true, 'amountPaise is required'],
      min: [1, 'amountPaise must be at least 1 paisa'],
      max: [MAX_AMOUNT_PAISE, `amountPaise cannot exceed ${MAX_AMOUNT_PAISE}`],
      validate: {
        validator: Number.isInteger,
        message: 'amountPaise must be an integer minor unit (no fractions)',
      },
    },
    category: {
      type: String,
      required: [true, 'category is required'],
      enum: {
        values: ALLOWED_CATEGORIES,
        message: '{VALUE} is not a supported category',
      },
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: [MAX_DESCRIPTION_LENGTH, `description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`],
      trim: true,
      default: '',
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

// Compound indexes for performant monthly querying and category sorting
expenseSchema.index({ date: -1, createdAt: -1 });
expenseSchema.index({ category: 1, date: -1 });

export const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
