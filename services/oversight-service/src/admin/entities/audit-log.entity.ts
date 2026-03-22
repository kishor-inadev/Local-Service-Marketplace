export class AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata: any;
  created_at: Date;
}
