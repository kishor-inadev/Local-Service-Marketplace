import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class LanguageValidationPipe implements PipeTransform {
  private readonly validLanguages = [
    'en', // English
    'es', // Spanish
    'fr', // French
    'de', // German
    'zh', // Chinese
    'ar', // Arabic
    'hi', // Hindi
    'pt', // Portuguese
    'ru', // Russian
    'ja', // Japanese
    'ko', // Korean
    'it', // Italian
  ];

  transform(value: any) {
    if (!value) return 'en'; // default

    if (!this.validLanguages.includes(value)) {
      throw new BadRequestException(
        `Invalid language code: ${value}. Supported languages: ${this.validLanguages.join(', ')}`,
      );
    }

    return value;
  }
}
