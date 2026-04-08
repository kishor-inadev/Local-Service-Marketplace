import { IsString, IsEnum, IsOptional, IsUrl } from "class-validator";

export class UploadDocumentDto {
  @IsString()
  provider_id: string;

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

  @IsUrl()
  document_url: string;

  @IsString()
  document_name: string;

  @IsOptional()
  @IsString()
  document_number?: string;

  @IsOptional()
  @IsString()
  expiry_date?: string;
}
