export class Attachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  created_at: Date;

  constructor(partial: Partial<Attachment>) {
    Object.assign(this, partial);
  }
}
