import { IsNotEmpty, IsString, IsOptional, Matches, MaxLength, IsIn } from 'class-validator';

export class CreateSystemSettingDto {
	@IsNotEmpty()
	@IsString()
	@MaxLength(100)
	@Matches(/^[a-z][a-z0-9_]*$/, {
		message: 'key must start with a lowercase letter and contain only lowercase letters, digits, and underscores',
	})
	key: string;

	@IsNotEmpty()
	@IsString()
	@MaxLength(1000)
	value: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsOptional()
	@IsString()
	@IsIn(['boolean', 'number', 'textarea', 'text'])
	type?: string;
}
