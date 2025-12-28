import { PollService } from '../services/poll.service.js';
import { UserManager } from './user.manager.js';

export function initializeTeacherHandler(io, { studentNamespace, pollManager }) {
  const userManager = new UserManager();


  io.on('connection', (socket) => {

    socket.emit('updateParticipantList', userManager.getParticipants());

    // --- Kick Student ---

socket.on('kickStudent', ({ targetUserSocketId }) => {

  if (targetUserSocketId) {
    // 2. Emit Force Disconnect 
    studentNamespace.to(targetUserSocketId).emit('forceDisconnect', { 
      reason: 'Teacher removed you from the session.' 
    });
    
    // 3. Force Close the Socket Connection
    const studentSocket = studentNamespace.sockets.get(targetUserSocketId);
    
    if (studentSocket) {
      studentSocket.disconnect(true);
      userManager.removeUser(targetUserSocketId);
      
      // 5. Broadcast new list to everyone
      const updatedList = userManager.getParticipants();
      io.emit('updateParticipantList', updatedList);      
      studentNamespace.emit('updateParticipantList', updatedList); 
    } 
  }});

    // Chat 
    socket.on('sendChatMessage', ({ text, senderName }) => {
      const messageData = {
        text,
        senderName,
        role: 'teacher',
        timestamp: new Date()
      };
      // Broadcast to everyone
      studentNamespace.emit('receiveChatMessage', messageData);
      io.emit('receiveChatMessage', messageData);
    });

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