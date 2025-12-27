import Poll from '../models/Poll.js';
import User from '../models/User.js'
import { AppError } from '../utils/AppError.js';

const nowMs = () => Date.now();

const computeTimeRemainingSeconds = (endTime) => {
  if (!endTime) return 0;
  return Math.max(0, Math.floor((new Date(endTime).getTime() - nowMs()) / 1000));
};

const computeResults = (poll) => {
  const totalVotes = (poll.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0);
  return {
    ...poll,
    totalVotes,
    options: (poll.options || []).map((opt) => ({
      ...opt,
      percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
    }))
  };
};

export const PollService = {
  async createPoll({ question, options, duration, createdBy }) {
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      throw new AppError('Question and at least 2 options are required', 400);
    }

    const correctCount = options.filter((o) => o?.isCorrect === true).length;
    if (correctCount !== 1) {
      throw new AppError('You must mark exactly one option as the correct answer.', 400);
    }

    const teacher = await User.findById(createdBy).lean();
    if (!teacher) throw new AppError('User not found', 404);
    if (teacher.role !== 'teacher') throw new AppError('Only teachers can create polls', 403);

    const poll = await Poll.create({
      question,
      options,
      duration,
      createdBy,
      status: 'draft'
    });

    return poll;
  },

  async getActivePolls() {
    try {
      const polls = await Poll.find({ status: 'active' }).sort({ startTime: -1 });
      return polls;
    } catch (error) {
      console.error('Error fetching active polls:', error);
      throw error;
    }
  },

  async getPolls({ status } = {}) {
    const filter = status ? { status } : {};
    return Poll.find(filter).sort({ createdAt: -1 }).lean();
  },

  async getPollById(pollId) {
    const poll = await Poll.findById(pollId).populate('createdBy', 'name role').lean();
    if (!poll) throw new AppError('Poll not found', 404);
    return poll;
  },

  async startPoll(pollId, userId) {
    const poll = await Poll.findById(pollId);
    if (!poll) throw new AppError('Poll not found', 404);

    if (String(poll.createdBy) !== String(userId)) {
      throw new AppError('Only the poll creator can start this poll', 403);
    }

    if (poll.status !== 'draft') {
      throw new AppError('Poll has already been started or completed', 400);
    }

    const activeExists = await Poll.exists({
      status: 'active',
      endTime: { $gt: new Date() }
    });

    if (activeExists) {
      throw new AppError('Another poll is already active', 409);
    }

    poll.status = 'active';
    poll.startTime = new Date();
    poll.endTime = new Date(nowMs() + poll.duration * 1000);

    await poll.save();

    return poll.toObject();
  },

  async endPoll(pollId) {
    const poll = await Poll.findByIdAndUpdate(
      pollId,
      { status: 'completed' },
      { new: true }
    ).lean();

    if (!poll) throw new AppError('Poll not found', 404);
    return poll;
  },

  async ensureNotExpired(pollId) {
    const poll = await Poll.findById(pollId).lean();
    if (!poll) throw new AppError('Poll not found', 404);

    if (poll.status === 'active' && poll.endTime && new Date(poll.endTime).getTime() <= nowMs()) {
      const ended = await this.endPoll(pollId);
      return { poll: ended, expired: true };
    }

    return { poll, expired: false };
  },

  async getPollState(pollId, userId) {
    const { poll, expired } = await this.ensureNotExpired(pollId);

    const hasVoted = (poll.participants || []).some(
      (p) => p?.user && String(p.user) === String(userId)
    );

    if (expired) {
      const results = await this.getPollResults(pollId);
      return {
        poll: results,
        hasVoted,
        timeRemaining: 0
      };
    }

    return {
      poll,
      hasVoted,
      timeRemaining: poll.status === 'active' ? computeTimeRemainingSeconds(poll.endTime) : 0
    };
  },

  async submitVote(pollId, optionIndex, userId) {
    const user = await User.findById(userId).lean();
    if (!user) throw new AppError('User not found', 404);

    const { poll, expired } = await this.ensureNotExpired(pollId);

    if (expired || poll.status !== 'active') {
      throw new AppError('Poll is not active', 400);
    }

    if (!Number.isInteger(optionIndex)) {
      throw new AppError('Invalid option index', 400);
    }

    if (optionIndex < 0 || optionIndex >= (poll.options || []).length) {
      throw new AppError('Invalid option index', 400);
    }

    const endTimeOk = poll.endTime && new Date(poll.endTime).getTime() > nowMs();
    if (!endTimeOk) {
      await this.endPoll(pollId);
      throw new AppError('Poll is not active', 400);
    }

    const update = await Poll.updateOne(
      {
        _id: pollId,
        status: 'active',
        endTime: { $gt: new Date() },
        'participants.user': { $ne: userId }
      },
      {
        $inc: { [`options.${optionIndex}.votes`]: 1 },
        $push: { participants: { user: userId, hasVoted: true } }
      }
    );

    if (update.modifiedCount === 0) {
      const refreshed = await Poll.findById(pollId).lean();
      if (!refreshed) throw new AppError('Poll not found', 404);

      if (refreshed.status !== 'active') throw new AppError('Poll is not active', 400);
      if (refreshed.endTime && new Date(refreshed.endTime).getTime() <= nowMs()) {
        await this.endPoll(pollId);
        throw new AppError('Poll is not active', 400);
      }

      const alreadyVoted = (refreshed.participants || []).some(
        (p) => p?.user && String(p.user) === String(userId)
      );

      if (alreadyVoted) throw new AppError('You have already voted in this poll', 400);

      throw new AppError('Failed to submit vote', 500);
    }

    const updatedPoll = await Poll.findById(pollId).lean();
    return updatedPoll;
  },

  async getPollResults(pollId) {
    const { poll } = await this.ensureNotExpired(pollId);
    return computeResults(poll);
  },

  async endExpiredPolls() {
    const expired = await Poll.find({
      status: 'active',
      endTime: { $lte: new Date() }
    }).select('_id').lean();

    if (!expired.length) return [];

    const ended = [];
    for (const p of expired) {
      try {
        const poll = await this.endPoll(p._id);
        ended.push(poll);
      } catch {
        // ignore
      }
    }
    return ended;
  }
};
