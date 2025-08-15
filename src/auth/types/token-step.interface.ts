import { ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';

export interface ITokenStep {
  execute(context: ExecutionContext): Promise<boolean>;
  handleInvalidToken?(request: Request, response: Response): Promise<void>;
}
