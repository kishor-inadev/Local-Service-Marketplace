import { IsString, IsOptional, IsBoolean, IsArray, IsUUID, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/, { message: 'Role name must be lowercase alphanumeric with underscores, starting with a letter' })
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  display_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  display_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class AssignPermissionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  permission_ids: string[];
}

export class ChangeUserRoleDto {
  @IsUUID('4')
  role_id: string;
}
