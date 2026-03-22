import { IsBoolean,IsOptional, IsUUID } from 'class-validator';

export class VerifyDocumentDto {
  @IsBoolean()
  verified: boolean;

  @IsOptional()
  @IsUUID()
  verified_by?: string;
}
