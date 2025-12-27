import { http } from './http.js';

export async function createPoll({ question, options, duration, createdBy }) {
  return http('/api/polls', {
    method: 'POST',
    body: { question, options, duration, createdBy }
  });
}

export async function getPolls({ status } = {}) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return http(`/api/polls${qs}`);
}

export async function getPoll(id) {
  return http(`/api/polls/${id}`);
}

export async function startPoll(id, userId) {
  return http(`/api/polls/${id}/start`, {
    method: 'POST',
    body: { userId }
  });
}

export async function endPoll(id) {
  return http(`/api/polls/${id}/end`, { method: 'POST' });
}

export async function getPollResults(id) {
  return http(`/api/polls/${id}/results`);
}
