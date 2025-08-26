import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger/logger.service';
export interface RequestWithCorrelation extends Request {
    correlationId: string;
}
export declare class CorrelationIdMiddleware implements NestMiddleware {
    private readonly logger;
    constructor(logger: Logger);
    use(req: RequestWithCorrelation, res: Response, next: NextFunction): void;
}
export declare function getCurrentCorrelationId(): string | undefined;
