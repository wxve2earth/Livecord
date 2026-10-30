import { EventEmitter } from 'node:events';

export const events = new EventEmitter();
const users = new Map();

export function setUser(id, data) {
  users.set(id, data);
  events.emit('update', id, data);
}

export function getUser(id) {
  return users.get(id);
}

export function removeUser(id) {
  users.delete(id);
}

export function getAllUsers() {
  return Object.fromEntries(users);
}