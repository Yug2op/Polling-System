import { initializeTeacherHandler } from './teacher.handler.js';
import { initializeStudentHandler } from './student.handler.js';
import { PollManager } from './poll.manager.js';
import { UserManager } from './user.manager.js';

export const initializeSocket = (io) => {
  const teacherNamespace = io.of('/teacher');
  const studentNamespace = io.of('/student');
  const pollManager = new PollManager({ teacherNamespace, studentNamespace });
  const userManager = new UserManager();

  // Initialize namespaces
  initializeTeacherHandler(teacherNamespace, { studentNamespace, pollManager, userManager });
  initializeStudentHandler(studentNamespace, { teacherNamespace, pollManager, userManager });

  // Cleanup on server shutdown
  const cleanup = () => {
    pollManager.cleanup();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
};