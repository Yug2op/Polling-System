import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [200, 'Option cannot be more than 200 characters'],
  },
  votes: {
    type: Number,
    default: 0,
  },
  isCorrect:{
    type:Boolean,
    default:false
  }
});

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      maxlength: [300, 'Question cannot be more than 300 characters'],
    },
    options: [optionSchema],
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Minimum duration is 15 seconds'],
      max: [120, 'Maximum duration is 120 seconds (2 minutes)'],
      default: 60,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed'],
      default: 'draft',
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        hasVoted: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
pollSchema.index({ status: 1, endTime: 1 });
pollSchema.index({ createdBy: 1, status: 1 });

// Virtual for total votes
pollSchema.virtual('totalVotes').get(function () {
  return this.options.reduce((total, option) => total + option.votes, 0);
});

// Method to check if a user can vote
pollSchema.methods.canVote = function (userId) {
  if (this.status !== 'active') return false;
  
  const participant = this.participants.find(p => 
    p.user && p.user.toString() === userId.toString()
  );
  
  if (!participant) return true; // New participant
  return !participant.hasVoted; // they haven't voted yet
};

// Method to add a participant
pollSchema.methods.addParticipant = function (userId) {
  const participantExists = this.participants.some(p => 
    p.user && p.user.toString() === userId.toString()
  );
  
  if (!participantExists) {
    this.participants.push({ user: userId, hasVoted: false });
  }
  
  return this.save();
};

// Method to mark a vote
pollSchema.methods.markVote = function (userId, optionIndex) {
  if (optionIndex < 0 || optionIndex >= this.options.length) {
    throw new Error('Invalid option index');
  }
  
  const participantIndex = this.participants.findIndex(p => 
    p.user && p.user.toString() === userId.toString()
  );
  
  if (participantIndex === -1) {
    this.participants.push({ 
      user: userId, 
      hasVoted: true 
    });
  } else {
    this.participants[participantIndex].hasVoted = true;
  }
  
  this.options[optionIndex].votes += 1;
  return this.save();
};

export default mongoose.model('Poll', pollSchema);