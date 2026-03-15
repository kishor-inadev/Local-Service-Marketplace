export class PayoutDto {
  id: string;
  amount: number;
  status: string;
  payout_method: string;
  payout_date: Date;
  transaction_count: number;
}

export class PayoutResponseDto {
  data: PayoutDto[];
  total: number;
}
