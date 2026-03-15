import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface User {
  username: string;
  password: string;
}

// Mock users — will be replaced by SAP HANA user table later
const MOCK_USERS: User[] = [
  { username: 'admin', password: 'admin' },
];

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(username: string, password: string) {
    const user = MOCK_USERS.find(
      (u) => u.username === username && u.password === password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.username, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      username: user.username,
    };
  }

  async validateUser(username: string) {
    return MOCK_USERS.find((u) => u.username === username) ?? null;
  }
}
