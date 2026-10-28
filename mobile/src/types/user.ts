// Espelha exatamente o contrato do backend (UserDto).
// id e active são controlados pelo backend e não são enviados pelo app.

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
}
