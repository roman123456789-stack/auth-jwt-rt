export interface RefreshTokenResult {
  id: string;
  created_at: Date;
  expires_at: Date;
  device_info?: Record<string, any>;
}
