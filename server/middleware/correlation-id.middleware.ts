import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logger/logger.service';

export interface RequestWithCorrelation extends Request {
  correlationId: string;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    // Generate or extract correlation ID
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    // Attach to request object
    req.correlationId = correlationId;

    // Add to response headers
    res.set('x-correlation-id', correlationId);

    // Log the incoming request
    this.logger.logWithContext('info', `${req.method} ${req.path}`, {
      correlationId,
      component: 'http',
      operation: 'request',
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Store in async local storage for the request context
    // This allows child operations to inherit the correlation ID
    const asyncLocalStorage = require('async_hooks').AsyncLocalStorage;
    if (!global.correlationStorage) {
      global.correlationStorage = new asyncLocalStorage();
    }

    global.correlationStorage.run({ correlationId }, () => {
      next();
    });
  }
}

// Helper function to get correlation ID from current context
export function getCurrentCorrelationId(): string | undefined {
  if (global.correlationStorage) {
    const store = global.correlationStorage.getStore();
    return store?.correlationId;
  }
  return undefined;
}