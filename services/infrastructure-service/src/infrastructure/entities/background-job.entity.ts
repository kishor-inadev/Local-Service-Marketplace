export class BackgroundJob {
  id: string;
  displayId: string;
  jobType: string;
  payload: any;
  status: string;
  attempts: number;
  lastError?: string;
  createdAt: Date;
  updatedAt?: Date;
  scheduledFor: Date;
}
