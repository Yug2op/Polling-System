import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: [true, 'Poll is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    optionIndex: {
      type: Number,
      required: [true, 'Option index is required'],
      min: [0, 'Invalid option index'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one vote per user per poll
voteSchema.index({ poll: 1, user: 1 }, { unique: true });

// Prevent duplicate votes
voteSchema.pre('save', async function () {
  const existingVote = await this.constructor.findOne({
    poll: this.poll,
    user: this.user,
  });

  if (existingVote) {
    const error = new Error('You have already voted in this poll');
    error.statusCode = 400;
    return error;
  }

});

// Update poll's vote count when a new vote is created
voteSchema.post('save', async function (doc) {
  const Poll = mongoose.model('Poll');
  await Poll.updateOne(
    { _id: doc.poll, 'options._id': doc.optionIndex },
    { $inc: { 'options.$.votes': 1 } }
  );
});

export default mongoose.model('Vote', voteSchema);