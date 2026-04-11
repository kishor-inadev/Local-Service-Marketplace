import { SetMetadata } from "@nestjs/common";

export const OWNERSHIP_KEY = "ownership";

/**
 * Ownership decorator - marks endpoints that require resource ownership validation
 * 
 * Usage:
 * @Ownership({ resourceType: 'request', userIdField: 'user_id' })
 * @Ownership({ resourceType: 'proposal', userIdField: 'provider_id' })
 * 
 * The guard will:
 * 1. Extract resource ID from route params
 * 2. Fetch the resource from the specified service
 * 3. Compare the userIdField with req.user.userId
 * 4. Allow if match OR if user is admin
 */
export interface OwnershipConfig {
  resourceType: "request" | "proposal" | "job" | "review";
  userIdField: "user_id" | "provider_id" | "customer_id";
  paramName?: string; // defaults to 'id'
}

export const Ownership = (config: OwnershipConfig) =>
  SetMetadata(OWNERSHIP_KEY, config);
