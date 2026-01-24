import { http } from './http.js';

export async function createUser({ name, role }) {
  return http('/api/users', { method: 'POST', body: { name, role } });
}

export async function getUser(id) {
  return http(`/api/users/${id}`);
}

export async function login({ name, password, role }) {
  return http('/api/users/login', { method: 'POST', body: { name, password, role } });
}

export async function signup({ name, password, role }) {
  return http('/api/users/signup', { method: 'POST', body: { name, password, role } });
}
