import { PollService } from '../services/poll.service.js';

export const createPoll = async (req, res, next) => {
    try {
        const { question, options, duration, createdBy } = req.body;

        const poll = await PollService.createPoll({ question, options, duration, createdBy });
        res.status(201).json({ success: true, message: 'Poll created successfully', data: poll });
    } catch (error) {
        next(error);
    }
};

export const getPolls = async (req, res, next) => {
    try {
        const { status } = req.query;
        const polls = await PollService.getPolls({ status });
        res.status(200).json({ success: true, data: polls });
    } catch (error) {
        next(error);
    }
};

export const getPoll = async (req, res, next) => {
    try {
        const poll = await PollService.getPollById(req.params.id);
        res.status(200).json({ success: true, data: poll });
    } catch (error) {
        next(error);
    }
};

export const startPoll = async (req, res, next) => {
    try {
        const poll = await PollService.startPoll(req.params.id, req.body.userId);

        req.app.get('io').of('/teacher').emit('pollStarted', { poll });
        res.status(200).json({
            success: true,
            data: poll,
            message: 'Poll started successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const endPollManual = async (req, res, next) => {
    try {
        const poll = await PollService.endPoll(req.params.id);

        try {
            const results = await PollService.getPollResults(req.params.id);
            const io = req.app.get('io');
            if (io) {
                io.of('/teacher').emit('pollEnded', { pollId: String(req.params.id), data: results });
                io.of('/student').emit('pollEnded', { pollId: String(req.params.id), data: results });
            }
        } catch (error) {
            next(error)
        }
        res.status(200).json({
            success: true,
            message: "Poll ended successfully",
            data: poll
        });
    } catch (error) {
        next(error)
    }
}

export const submitVote = async (req, res, next) => {
    try {
        const { optionIndex, userId } = req.body;
        const updatedPoll = await PollService.submitVote(req.params.id, optionIndex, userId);

        const totalVotes = (updatedPoll.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0);
        req.app.get('io').of('/teacher').emit('voteReceived', {
            pollId: updatedPoll._id,
            results: updatedPoll.options,
            totalVotes
        });

        res.status(200).json({
            success: true,
            message: 'Vote recorded successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const getPollResults = async (req, res, next) => {
    try {
        const results = await PollService.getPollResults(req.params.id);
        res.json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};