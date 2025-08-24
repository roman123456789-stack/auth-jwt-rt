import * as UAParser from 'ua-parser-js';
import { Request } from 'express';
import { DeviceInfo } from '../types/device-info.interface';

export function getDeviceInfo(request: Request): DeviceInfo {
  const userAgent = request.headers['user-agent'] || '';

  const ip =
    request.ip ||
    request.ips?.[0] ||
    (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    '0.0.0.0';

  const parser = new (UAParser as any)(userAgent);

  return {
    userAgent,
    ip,
    browser: parser.getBrowser(),
    os: parser.getOS(),
    device: parser.getDevice(),
  };
}
