import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/http.js';

export function createTeacherSocket() {
  return io(`${API_BASE_URL}/teacher`, {
    transports: ['websocket']
  });
}

export function createStudentSocket() {
  return io(`${API_BASE_URL}/student`, {
    transports: ['websocket']
  });
}
