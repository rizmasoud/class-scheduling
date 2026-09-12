import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_CONNECTION } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    @Inject(PG_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    let teacherId = undefined;
    if (user.role === 'Teacher') {
      const teacher = await this.db.query.teachers.findFirst({
        where: eq(schema.teachers.userId, user.id)
      });
      if (teacher) {
        teacherId = teacher.id;
      }
    }

    return { userId: payload.sub, username: payload.username, role: payload.role, teacherId };
  }
}
