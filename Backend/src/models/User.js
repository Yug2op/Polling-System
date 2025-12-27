import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      required: [true, 'Role is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting user's polls
userSchema.virtual('polls', {
  ref: 'Poll',
  localField: '_id',
  foreignField: 'createdBy',
});

// Virtual for getting user's votes
userSchema.virtual('votes', {
  ref: 'Vote',
  localField: '_id',
  foreignField: 'user',
});

// Update lastActive timestamp before saving
userSchema.pre('save', function() {
  this.lastActive = Date.now();
});

// Method to get user's active polls
userSchema.methods.getActivePolls = async function() {
  return await mongoose.model('Poll').find({
    createdBy: this._id,
    status: 'active'
  });
};

// Method to get user's voting history
userSchema.methods.getVotingHistory = async function() {
  return await mongoose.model('Vote')
    .find({ user: this._id })
    .populate('poll', 'question status')
    .sort({ createdAt: -1 });
};

export default mongoose.model('User', userSchema);