import { IsUUID, IsNotEmpty } from "class-validator";

export class AddProviderServiceDto {
  @IsUUID("4", { message: "category_id must be a valid UUID" })
  @IsNotEmpty()
  category_id: string;
}
