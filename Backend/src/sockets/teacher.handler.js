import { PollService } from '../services/poll.service.js';

export function initializeTeacherHandler(io, { studentNamespace, pollManager }) {
  io.on('connection', (socket) => {

    // Handle starting a new poll
    socket.on('startPoll', async ({ pollId, userId }) => {
      try {
        const poll = await pollManager.startPoll(pollId, userId);
        
        // Notify all clients about the new poll
        studentNamespace.emit('pollStarted', { 
          poll,
          timeRemaining: pollManager.getPollRemainingTime(pollId)
        });

        io.emit('pollUpdated', { poll });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle getting poll results
    socket.on('getPollResults', async (pollId) => {
      try {
        const results = await PollService.getPollResults(pollId);
        socket.emit('pollResults', { success: true, data: results });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
    });
  });
}