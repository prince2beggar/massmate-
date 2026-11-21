/**
 * MessMate — Multi-Tenant Context & Isolation Errors (Task 22)
 *
 * Sanitized, structured error classes for tenant resolution, membership verification,
 * and data boundary enforcement.
 *
 * Security Requirements:
 * - Never leak database connection strings, credentials, or internal SQL details.
 * - Never expose private records or metadata from another tenant.
 * - Return consistent, machine-readable error codes.
 */

export class TenantSecurityError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code = 'TENANT_SECURITY_ERROR', statusCode = 403) {
    super(message);
    this.name = 'TenantSecurityError';
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when an unauthenticated actor attempts to access a tenant-scoped route or resource.
 */
export class UnauthenticatedError extends TenantSecurityError {
  constructor(message = 'Authentication is required to access this mess.') {
    super(message, 'UNAUTHENTICATED', 401);
    this.name = 'UnauthenticatedError';
  }
}

/**
 * Thrown when the requested tenant slug or ID does not exist.
 */
export class TenantNotFoundError extends TenantSecurityError {
  constructor(message = 'The requested mess could not be found.') {
    super(message, 'TENANT_NOT_FOUND', 404);
    this.name = 'TenantNotFoundError';
  }
}

/**
 * Thrown when the user has no membership relationship in the target tenant.
 */
export class TenantAccessDeniedError extends TenantSecurityError {
  constructor(message = 'You do not have access to this mess.') {
    super(message, 'TENANT_ACCESS_DENIED', 403);
    this.name = 'TenantAccessDeniedError';
  }
}

/**
 * Thrown when the user's membership exists but is not ACTIVE (e.g., PENDING, SUSPENDED, LEFT).
 */
export class MembershipInactiveError extends TenantSecurityError {
  public readonly membershipStatus: string;

  constructor(status: string, message = 'Your membership in this mess is not active.') {
    super(message, 'MEMBERSHIP_INACTIVE', 403);
    this.name = 'MembershipInactiveError';
    this.membershipStatus = status;
  }
}

/**
 * Thrown when an active membership exists, but the mess itself has been suspended.
 */
export class TenantSuspendedError extends TenantSecurityError {
  constructor(message = 'This mess account has been suspended by platform administration.') {
    super(message, 'TENANT_SUSPENDED', 403);
    this.name = 'TenantSuspendedError';
  }
}

/**
 * Thrown when the tenant account is not active (e.g., PENDING approval or INACTIVE).
 */
export class TenantInactiveError extends TenantSecurityError {
  public readonly tenantStatus: string;

  constructor(status: string, message = 'This mess account is currently not active.') {
    super(message, 'TENANT_INACTIVE', 403);
    this.name = 'TenantInactiveError';
    this.tenantStatus = status;
  }
}

/**
 * Thrown when an active user lacks the required permission in the tenant.
 */
export class PermissionDeniedError extends TenantSecurityError {
  public readonly requiredPermission?: string;

  constructor(message = 'You do not have permission to perform this action in this mess.', requiredPermission?: string) {
    super(message, 'PERMISSION_DENIED', 403);
    this.name = 'PermissionDeniedError';
    this.requiredPermission = requiredPermission;
  }
}

/**
 * Thrown when an operation in Tenant A attempts to read, link, or reference a record from Tenant B.
 */
export class CrossTenantViolationError extends TenantSecurityError {
  constructor(message = 'Cross-tenant resource reference is strictly forbidden.') {
    super(message, 'CROSS_TENANT_VIOLATION', 400);
    this.name = 'CrossTenantViolationError';
  }
}
