export interface PaginationMetadata {
  total_pages: number;
  current_page: number;
}

export interface Paginated<T> {
  results: T[];
  metadata: {
    pagination?: PaginationMetadata;
  } & PaginationMetadata;
}

/**
 * Standard Withallo response envelope: `{ "data": ... }`.
 */
export interface EnvelopedResponse<T> {
  data: T;
}
