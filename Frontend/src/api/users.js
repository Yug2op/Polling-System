import { http } from './http.js';

export async function createUser({ name, role }) {
  return http('/api/users', { method: 'POST', body: { name, role } });
}

export async function getUser(id) {
  return http(`/api/users/${id}`);
}
