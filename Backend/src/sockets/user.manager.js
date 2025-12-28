// socket/user.manager.js
export class UserManager {
    constructor() {
      // Maps socket.id -> { userId, name, joinedAt }
      this.users = new Map();
    }
  
    addUser(socketId, userData) {
      this.users.set(socketId, {
        ...userData,
        socketId, // Store socketId inside the object for easy access
        joinedAt: new Date()
      });
    }
  
    removeUser(socketId) {
      this.users.delete(socketId);
    }
  
    getUser(socketId) {
      return this.users.get(socketId);
    }
  
    // Find a socket ID based on the user's database ID (for kicking)
    findSocketIdByUserId(userId) {
        for (const [socketId, user] of this.users.entries()) {
          // Use '==' to match "123" (string) with 123 (number)
          if (user.userId == userId) {
            return socketId;
          }
        }
        return null;
      }
  
    getParticipants() {
      return Array.from(this.users.values());
    }
  }