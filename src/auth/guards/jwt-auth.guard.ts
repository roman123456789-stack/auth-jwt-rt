import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ValidAccessStep } from '../strategies/valid-access.step';
import { RefreshAccessStep } from '../strategies/refresh-access.step';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private validAccessStep: ValidAccessStep,
    private refreshAccessStep: RefreshAccessStep,
  ) {
    super('jwt');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (error) {
      const isTokenValid = await this.validAccessStep.execute(context);
      if (isTokenValid) {
        await this.refreshAccessStep.execute(context);
        return true;
      } else {
        return false;
      }
    }
  }
}
