import mongoose from 'mongoose';

const FormatModeCategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'عنوان نوع برگزاری الزامی است'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'کد الزامی است'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    examples: [
      {
        type: String,
        trim: true,
      },
    ],
    icon: {
      type: String,
      default: '📍',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    // آمار
    eventsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
FormatModeCategorySchema.index({ code: 1 }, { unique: true });
FormatModeCategorySchema.index({ isActive: 1, isVisible: 1 });
FormatModeCategorySchema.index({ order: 1 });
FormatModeCategorySchema.index({ createdAt: -1 });

// Text search index
FormatModeCategorySchema.index(
  {
    title: 'text',
    description: 'text',
    code: 'text',
  },
  {
    weights: {
      title: 3,
      code: 2,
      description: 1,
    },
  }
);

// Methods
FormatModeCategorySchema.methods.incrementEventsCount = function () {
  this.eventsCount += 1;
  return this.save();
};

FormatModeCategorySchema.methods.decrementEventsCount = function () {
  if (this.eventsCount > 0) {
    this.eventsCount -= 1;
    return this.save();
  }
  return this;
};

// Statics
FormatModeCategorySchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ order: 1, title: 1 });
};

FormatModeCategorySchema.statics.findVisible = function () {
  return this.find({ isActive: true, isVisible: true }).sort({ order: 1, title: 1 });
};

FormatModeCategorySchema.statics.generateUniqueCode = async function (baseCode) {
  let code = baseCode.toUpperCase().replace(/\s+/g, '_');
  let counter = 1;

  while (await this.exists({ code })) {
    code = `${baseCode}_${counter}`;
    counter++;
  }

  return code;
};

const FormatModeCategory =
  mongoose.models.FormatModeCategory ||
  mongoose.model('FormatModeCategory', FormatModeCategorySchema);

export default FormatModeCategory;




