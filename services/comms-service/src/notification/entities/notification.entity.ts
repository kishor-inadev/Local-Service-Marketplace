export class Notification {
	id: string;
	display_id: string;
	user_id: string;
	type: string;
	message: string;
	read: boolean;
	unsubscribed?: boolean; // Whether user has unsubscribed from this type (nullable in DB)
	created_at: Date;

	constructor(partial: Partial<Notification>) {
		Object.assign(this, partial);
	}
}
