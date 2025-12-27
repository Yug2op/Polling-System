import { initializeTeacherHandler } from './teacher.handler.js';
import { initializeStudentHandler } from './student.handler.js';
import { PollManager } from './poll.manager.js';

export const initializeSocket = (io) => {
  const teacherNamespace = io.of('/teacher');
  const studentNamespace = io.of('/student');
  const pollManager = new PollManager({ teacherNamespace, studentNamespace });

  // Initialize namespaces
  initializeTeacherHandler(teacherNamespace, { studentNamespace, pollManager });
  initializeStudentHandler(studentNamespace, { teacherNamespace, pollManager });

  // Cleanup on server shutdown
  const cleanup = () => {
    pollManager.cleanup();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
};