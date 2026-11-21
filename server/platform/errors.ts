if (typeof window !== 'undefined') {
  throw new Error('Platform authorization errors can only be instantiated on the server.');
}

import { AppError } from '@/server/api/errors';
import type { ApiErrorCode } from '@/types/api';

export class PlatformAuthError extends AppError {
  constructor(
    message: string,
    code: ApiErrorCode = 'PLATFORM_ACCESS_DENIED',
    statusCode = 403
  ) {
    super(message, code, statusCode);
    this.name = 'PlatformAuthError';
  }
}

export class PlatformUnauthenticatedError extends PlatformAuthError {
  constructor(message = 'Platform administrator authentication required.') {
    super(message, 'UNAUTHENTICATED', 401);
    this.name = 'PlatformUnauthenticatedError';
  }
}

export class PlatformAccessDeniedError extends PlatformAuthError {
  constructor(
    message = 'Access denied. Account does not possess platform administrator privileges.'
  ) {
    super(message, 'PLATFORM_ACCESS_DENIED', 403);
    this.name = 'PlatformAccessDeniedError';
  }
}

export class PlatformForbiddenError extends PlatformAuthError {
  public readonly requiredPermission?: string;

  constructor(requiredPermission?: string) {
    const msg = requiredPermission
      ? `Action requires platform permission: '${requiredPermission}'.`
      : 'Access forbidden for current platform role.';
    super(msg, 'PERMISSION_DENIED', 403);
    this.name = 'PlatformForbiddenError';
    this.requiredPermission = requiredPermission;
  }
}

export class PlatformUserInactiveError extends PlatformAuthError {
  constructor(status: string) {
    super(
      `Platform administrator account is currently ${status.toLowerCase()}. Access denied.`,
      'PLATFORM_ACCESS_DENIED',
      403
    );
    this.name = 'PlatformUserInactiveError';
  }
}

export class PlatformNotFoundError extends PlatformAuthError {
  constructor(message = 'Platform resource not found.') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'PlatformNotFoundError';
  }
}

export class PlatformValidationError extends PlatformAuthError {
  constructor(message = 'Validation error.') {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'PlatformValidationError';
  }
}
