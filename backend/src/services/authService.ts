import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository';
import { layoutRepository } from '../repositories/layoutRepository';
import { LoginResponse, Role } from '../types';
import { JWT_SECRET } from '../middleware/auth';

export class AuthService {
  async login(role: Role = 'demand_planner'): Promise<LoginResponse> {
    const user = await userRepository.findByRole(role);
    if (!user) {
      throw new Error(`User with role ${role} not found`);
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        roleTitle: user.roleTitle,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const layoutManifest = (await layoutRepository.getByRole(role)) || {
      role,
      roleTitle: user.roleTitle,
      headerControls: {
        showProductLevel: true,
        showCustomerLevel: true,
        showUom: true,
        actions: ['save', 'commit', 'table', 'filter', 'scenarios'],
      },
      widgets: [],
    };

    return {
      token,
      user,
      layoutManifest,
    };
  }
}

export const authService = new AuthService();

