import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateJobDto {
	@IsString()
	request_id: string;

	@IsString()
	provider_id: string;

	// Set by controller from authenticated user headers — not accepted from body
	customer_id?: string;

	@IsOptional()
	@IsString()
	proposal_id?: string;

	@IsOptional()
	@IsNumber()
	@Min(1)
	actual_amount?: number;
}
