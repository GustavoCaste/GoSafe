import { apiRequest } from './api';
import { CreateUserPayload, User } from '../types/user';

export function createUser(payload: CreateUserPayload): Promise<User> {
  return apiRequest<User>('/users', { method: 'POST', body: payload });
}
