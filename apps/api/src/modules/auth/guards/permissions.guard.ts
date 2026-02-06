import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user || !user.roles) {
      return false;
    }

    // Collect all permissions from all roles
    const userPermissions = new Set<string>();
    for (const role of user.roles) {
      if (role.permissions) {
        for (const permission of role.permissions) {
          userPermissions.add(permission.key);
        }
      }
    }

    // Check if user has all required permissions
    return requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );
  }
}
