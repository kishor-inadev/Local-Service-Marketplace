export class Dispute {
  id: string;
  display_id: string;
  job_id: string;
  opened_by: string;
  reason: string;
  status: string;
  resolution?: string;
  resolved_by?: string;
  resolved_at?: Date;
  created_at: Date;
  updated_at?: Date;
}
