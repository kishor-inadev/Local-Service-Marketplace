import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Inject,
  LoggerService,
} from "@nestjs/common";
import { Reflector, ModuleRef } from "@nestjs/core";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { OWNERSHIP_KEY, OwnershipConfig } from "../decorators/ownership.decorator";
import { RequestService } from "../../modules/request/services/request.service";
import { ProposalService } from "../../modules/proposal/services/proposal.service";
import { JobService } from "../../modules/job/services/job.service";
import { ReviewService } from "../../modules/review/services/review.service";

/**
 * OwnershipGuard - Validates that the authenticated user owns the requested resource
 * 
 * Used in combination with @Ownership() decorator
 * 
 * Example:
 * @UseGuards(JwtAuthGuard, OwnershipGuard)
 * @Ownership({ resourceType: 'request', userIdField: 'user_id' })
 * @Patch(':id')
 * async updateRequest(@Param('id') id: string, @Body() dto: UpdateRequestDto)
 * 
 * This guards against:
 * - Users updating other users' requests
 * - Providers accepting proposals they don't own
 * - Customers completing jobs they don't own
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<OwnershipConfig>(
      OWNERSHIP_KEY,
      context.getHandler(),
    );

    if (!config) {
      // No ownership config, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException("Authentication required");
    }

    // Users with manage permission for the resource bypass ownership checks
    const managePermission = `${config.resourceType}s.manage`;
    if (user.permissions?.includes(managePermission) || user.permissions?.includes('admin.access')) {
      return true;
    }

    const paramName = config.paramName || "id";
    const resourceId = request.params[paramName];

    if (!resourceId) {
      throw new ForbiddenException(`Missing resource ID parameter: ${paramName}`);
    }

    // Fetch resource and validate ownership
    const resource = await this.fetchResource(config.resourceType, resourceId);

    if (!resource) {
      throw new NotFoundException(`${config.resourceType} not found`);
    }

    const resourceOwnerId = resource[config.userIdField];

    if (!resourceOwnerId) {
      this.logger.error(
        `Ownership field '${config.userIdField}' not found on ${config.resourceType} ${resourceId}`,
        "OwnershipGuard",
      );
      throw new ForbiddenException("Resource ownership cannot be determined");
    }

    const isOwner =
      resourceOwnerId === user.userId ||
      (user.providerId && resourceOwnerId === user.providerId);

    if (!isOwner) {
      this.logger.warn(
        `User ${user.userId} (provider ${user.providerId}) attempted to access ${config.resourceType} ${resourceId} owned by ${resourceOwnerId}`,
        "OwnershipGuard",
      );
      throw new ForbiddenException(
        `You do not have permission to access this ${config.resourceType}`,
      );
    }

    // Attach resource to request for use in controller (avoid duplicate fetch)
    request.resource = resource;

    return true;
  }

  private async fetchResource(
    resourceType: string,
    resourceId: string,
  ): Promise<any> {
    switch (resourceType) {
      case "request": {
        const service = this.moduleRef.get(RequestService, { strict: false });
        return service.getRequestById(resourceId);
      }
      case "proposal": {
        const service = this.moduleRef.get(ProposalService, { strict: false });
        return service.getProposalById(resourceId);
      }
      case "job": {
        const service = this.moduleRef.get(JobService, { strict: false });
        return service.getJobById(resourceId);
      }
      case "review": {
        const service = this.moduleRef.get(ReviewService, { strict: false });
        return service.getReviewById(resourceId);
      }
      default:
        throw new ForbiddenException(`Unknown resource type: ${resourceType}`);
    }
  }
}
