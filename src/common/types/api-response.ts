export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly timestamp: string;
}

export function ok<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}
