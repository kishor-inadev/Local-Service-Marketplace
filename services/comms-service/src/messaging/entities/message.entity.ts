export class Message {
  id: string;
  display_id: string;
  job_id: string;
  sender_id: string;
  message: string;
  read: boolean; // ✅ NEW
  read_at?: Date; // ✅ NEW
  edited: boolean; // ✅ NEW
  edited_at?: Date; // ✅ NEW
  created_at: Date;

  constructor(partial: Partial<Message>) {
    Object.assign(this, partial);
  }
}
