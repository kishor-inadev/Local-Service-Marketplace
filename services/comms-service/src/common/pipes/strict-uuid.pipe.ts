import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class StrictUuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value) {
      throw new BadRequestException("ID is required");
    }

    if (!UUID_REGEX.test(value)) {
      throw new BadRequestException("Invalid ID format: UUID is required");
    }

    return value.toLowerCase();
  }
}
