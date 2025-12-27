import { PollService } from '../services/poll.service.js';

export function initializeStudentHandler(io, { teacherNamespace, pollManager }) {
  io.on('connection', async(socket) => {
    // active poll
     try {
      const activePolls = await PollService.getActivePolls();
      
      if (activePolls && activePolls.length > 0) {
        const currentPoll = activePolls[0];
        const timeRemaining = pollManager.getPollRemainingTime(currentPoll._id);
        
        socket.emit('pollStarted', {
          poll: currentPoll,
          timeRemaining
        });
      }
    } catch (error) {
      console.error('Error sending initial poll state:', error);
    }

    // Handle student submitting a vote
    socket.on('submitVote', async ({ pollId, optionIndex, userId }, callback) => {
      try {
        const updatedPoll = await PollService.submitVote(pollId, optionIndex, userId);

        // Emit to teacher namespace
        teacherNamespace.emit('voteReceived', { 
          pollId,
          results: updatedPoll.options,
          totalVotes: (updatedPoll.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0)
        });

        // Send success response to student
        callback({ 
          success: true, 
          message: 'Vote recorded successfully' 
        });

      } catch (error) {
        console.error('Vote submission error:', error);
        callback({ 
          success: false, 
          error: error.message || 'Failed to submit vote',
          ...(error.statusCode && { statusCode: error.statusCode })
        });
      }
    });

    // Handle getting current poll state
    socket.on('getPollState', async ({ pollId, userId }, callback) => {
      try {
        const state = await PollService.getPollState(pollId, userId);
        const poll = state.poll;

        // Prepare safe poll data
        const pollData = {
          ...poll,
          hasVoted: state.hasVoted,
          timeRemaining: state.timeRemaining,
          // Hide correct answers if poll is still active
          options: poll.options.map(opt => ({
            ...opt,
            isCorrect: poll.status === 'completed' ? opt.isCorrect : undefined
          }))
        };

        callback({ 
          success: true, 
          data: pollData 
        });

      } catch (error) {
        console.error('Error getting poll state:', error);
        callback({ 
          success: false, 
          error: error.message || 'Failed to get poll state',
          ...(error.statusCode && { statusCode: error.statusCode })
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
    });
  });
}