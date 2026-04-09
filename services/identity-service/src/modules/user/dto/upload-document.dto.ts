import { IsString, IsEnum, IsOptional, IsUrl } from "class-validator";

export class UploadDocumentDto {
  @IsOptional()
  @IsString()
  provider_id?: string;

  @IsEnum([
    "government_id",
    "business_license",
    "insurance_certificate",
    "certification",
    "tax_document",
  ])
  document_type:
    | "government_id"
    | "business_license"
    | "insurance_certificate"
    | "certification"
    | "tax_document";

  @IsOptional()
  @IsUrl()
  document_url?: string;

  @IsOptional()
  @IsString()
  document_name?: string;

  @IsOptional()
  @IsString()
  document_number?: string;

  @IsOptional()
  @IsString()
  expiry_date?: string;
}
