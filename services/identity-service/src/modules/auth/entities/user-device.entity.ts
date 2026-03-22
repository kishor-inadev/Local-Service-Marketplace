export class UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_type?: string;
  os?: string;
  last_seen: Date;
}
