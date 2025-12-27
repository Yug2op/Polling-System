// Backend/src/sockets/poll.manager.js
import { PollService } from '../services/poll.service.js';

export class PollManager {
  constructor({ teacherNamespace, studentNamespace } = {}) {
    this.activePolls = new Map();
    this.teacherNamespace = teacherNamespace;
    this.studentNamespace = studentNamespace;
  }

  async startPoll(pollId, userId) {
    try {
      const poll = await PollService.startPoll(pollId, userId);

      // Store poll in active polls map
      const endTime = new Date(poll.endTime).getTime();
      this.activePolls.set(pollId.toString(), { endTime, timer: null });

      // Set up auto-end timer
      const timeRemaining = endTime - Date.now();
      if (timeRemaining > 0) {
        const timer = setTimeout(() => {
          this.handlePollEnd(pollId).catch(console.error);
        }, timeRemaining);
        
        this.activePolls.get(pollId.toString()).timer = timer;
      }

      return poll;
    } catch (error) {
      console.error('Error starting poll:', error);
      throw error;
    }
  }

  async handlePollEnd(pollId) {
    try {
      const poll = await PollService.endPoll(pollId);

      // Clean up timer and remove from active polls
      this.cleanupPoll(pollId);

      const results = await PollService.getPollResults(pollId);

      if (this.teacherNamespace) {
        this.teacherNamespace.emit('pollEnded', { pollId: String(pollId), data: results });
      }
      if (this.studentNamespace) {
        this.studentNamespace.emit('pollEnded', { pollId: String(pollId), data: results });
      }

      return results;
    } catch (error) {
      console.error('Error in handlePollEnd:', error);
      throw error;
    }
  }

  async endPoll(pollId) {
    try {
      return this.handlePollEnd(pollId);
    } catch (error) {
      console.error('Error ending poll:', error);
      throw error;
    }
  }

  getPollRemainingTime(pollId) {
    const pollData = this.activePolls.get(pollId.toString());
    if (!pollData) return 0;
    return Math.max(0, Math.floor((pollData.endTime - Date.now()) / 1000));
  }

  cleanupPoll(pollId) {
    const pollData = this.activePolls.get(pollId.toString());
    if (pollData) {
      if (pollData.timer) {
        clearTimeout(pollData.timer);
      }
      this.activePolls.delete(pollId.toString());
    }
  }

  cleanup() {
    for (const [pollId, data] of this.activePolls.entries()) {
      if (data?.timer) {
        clearTimeout(data.timer);
      }
    }
    this.activePolls.clear();
  }
}