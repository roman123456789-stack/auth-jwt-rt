export interface DeviceInfo {
  userAgent: string;
  ip: string;
  browser: {
    name: string;
    version: string;
  };
  os: {
    name: string;
    version: string;
  };
  device: {
    type: 'desktop' | 'mobile' | 'tablet' | undefined;
    model: string;
    vendor: string;
  };
}
