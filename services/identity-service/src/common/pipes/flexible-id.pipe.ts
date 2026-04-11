import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DISPLAY_ID_REGEX = /^[A-Z]{3}[A-Z0-9]{8}$/; // exactly 3-char prefix + 8 alphanumeric = 11 chars

@Injectable()
export class FlexibleIdPipe implements PipeTransform {
  transform(value: string) {
    if (!value) throw new BadRequestException("ID is required");
    if (UUID_REGEX.test(value)) {
      return value.toLowerCase(); // keep UUID lowercase (PostgreSQL convention)
    }
    const upper = value.toUpperCase();
    if (DISPLAY_ID_REGEX.test(upper)) {
      return upper; // normalise display_id to uppercase
    }
    throw new BadRequestException(
      `Invalid ID format: must be a UUID or a display ID (e.g. JOB4R2F9HYZ)`,
    );
  }
}
