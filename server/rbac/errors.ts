/**
 * MessMate — Structured RBAC & Authorization Errors (Task 21)
 *
 * Security Requirements:
 * - Never leak database connection strings, credentials, or SQL details in client errors.
 * - Provide clear, actionable operational messages for internal logs and audit events.
 * - Secure default-deny representation.
 */

export class AuthorizationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code = 'AUTHORIZATION_DENIED', statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a user has no membership relationship in the target tenant.
 */
export class TenantAccessDeniedError extends AuthorizationError {
  constructor(message = 'Access to the requested mess was denied.') {
    super(message, 'TENANT_ACCESS_DENIED', 403);
    this.name = 'TenantAccessDeniedError';
  }
}

/**
 * Thrown when a user membership is not in ACTIVE state (e.g. PENDING, SUSPENDED, LEFT).
 */
export class InactiveMembershipError extends AuthorizationError {
  public readonly membershipStatus: string;

  constructor(status: string, message = 'Your membership in this mess is not active.') {
    super(message, 'INACTIVE_MEMBERSHIP', 403);
    this.name = 'InactiveMembershipError';
    this.membershipStatus = status;
  }
}

/**
 * Thrown when an active user lacks the required granular permission(s).
 */
export class ForbiddenError extends AuthorizationError {
  public readonly requiredPermission?: string;

  constructor(message = 'You do not have permission to perform this action.', requiredPermission?: string) {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
    this.requiredPermission = requiredPermission;
  }
}

/**
 * Thrown when a user attempts to delegate or assign permissions they do not possess.
 */
export class PrivilegeEscalationError extends AuthorizationError {
  constructor(message = 'Cannot grant permissions beyond your own authorized capabilities.') {
    super(message, 'PRIVILEGE_ESCALATION_BLOCKED', 403);
    this.name = 'PrivilegeEscalationError';
  }
}

/**
 * Thrown when an action would illegally demote or delete the last remaining Owner of a tenant.
 */
export class OwnerProtectionError extends AuthorizationError {
  constructor(message = 'Cannot remove or demote the sole active Owner of the mess. Designate a replacement Owner first.') {
    super(message, 'OWNER_PROTECTION_VIOLATION', 400);
    this.name = 'OwnerProtectionError';
  }
}

/**
 * Thrown when a role or resource from Tenant A is improperly referenced within Tenant B.
 */
export class CrossTenantError extends AuthorizationError {
  constructor(message = 'Cross-tenant resource reference is strictly forbidden.') {
    super(message, 'CROSS_TENANT_VIOLATION', 400);
    this.name = 'CrossTenantError';
  }
}
