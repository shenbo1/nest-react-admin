/**
 * IP 地理位置工具函数
 * 使用 ip-api.com 免费服务获取 IP 地理位置信息
 */

interface IpApiResponse {
  status: 'success' | 'fail';
  country?: string;
  regionName?: string;
  city?: string;
  message?: string;
}

/**
 * 根据 IP 地址获取地理位置
 * @param ip IP 地址
 * @returns 地理位置字符串，如 "中国 北京 北京"
 */
export async function getIpLocation(ip: string): Promise<string> {
  // 内网 IP 直接返回
  if (isInternalIp(ip)) {
    return '内网IP';
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`, {
      signal: AbortSignal.timeout(3000), // 3秒超时
    });

    if (!response.ok) {
      return 'Unknown';
    }

    const data: IpApiResponse = await response.json();

    if (data.status === 'success') {
      const parts = [data.country, data.regionName, data.city].filter(Boolean);
      return parts.join(' ') || 'Unknown';
    }

    return 'Unknown';
  } catch {
    // 网络错误或超时，静默失败
    return 'Unknown';
  }
}

/**
 * 判断是否为内网 IP
 */
function isInternalIp(ip: string): boolean {
  if (!ip) return true;

  // IPv6 本地地址
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true;

  // IPv4 内网地址段
  const parts = ip.split('.');
  if (parts.length !== 4) return true;

  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);

  // 10.0.0.0 - 10.255.255.255
  if (first === 10) return true;

  // 172.16.0.0 - 172.31.255.255
  if (first === 172 && second >= 16 && second <= 31) return true;

  // 192.168.0.0 - 192.168.255.255
  if (first === 192 && second === 168) return true;

  // 127.0.0.0 - 127.255.255.255
  if (first === 127) return true;

  return false;
}
