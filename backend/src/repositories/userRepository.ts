import usersData from '../data/users.json';
import { User, Role } from '../types';

export class UserRepository {
  private users: User[] = usersData as User[];

  async findById(id: string): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async findByRole(role: Role): Promise<User | undefined> {
    return this.users.find((u) => u.role === role);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return (this.users as any[]).find((u) => u.email === email);
  }

  async getAll(): Promise<User[]> {
    return this.users;
  }
}

export const userRepository = new UserRepository();

