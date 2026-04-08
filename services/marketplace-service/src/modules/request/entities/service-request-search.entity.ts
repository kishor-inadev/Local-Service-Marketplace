export class ServiceRequestSearch {
  request_id: string;
  category?: string;
  location?: string;
  description?: string;
  search_vector?: string; // tsvector for full-text search
}
