import { SensitiveType } from '../constants/sensitive.constant';

/**
 * 脱敏工具类
 */
export class MaskUtil {
  /**
   * 手机号脱敏：138****1234
   */
  static maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone;
    return phone.replace(/(\d{3})\d{4}(\d+)/, '$1****$2');
  }

  /**
   * 邮箱脱敏：t***@example.com
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 1) return `*@${domain}`;
    return `${local[0]}***@${domain}`;
  }

  /**
   * 身份证号脱敏：110***********1234
   */
  static maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 8) return idCard;
    return idCard.replace(/(\d{3})\d+(\d{4})/, '$1***********$2');
  }

  /**
   * 银行卡号/税号脱敏：6222****1234
   */
  static maskBankCard(cardNo: string): string {
    if (!cardNo || cardNo.length < 8) return cardNo;
    const len = cardNo.length;
    const prefix = cardNo.substring(0, 4);
    const suffix = cardNo.substring(len - 4);
    return `${prefix}****${suffix}`;
  }

  /**
   * 姓名脱敏：张*、张**
   */
  static maskName(name: string): string {
    if (!name) return name;
    if (name.length === 2) {
      return name[0] + '*';
    }
    if (name.length > 2) {
      return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
    }
    return name;
  }

  /**
   * 地址脱敏：保留前10个字符，后面用*替代
   */
  static maskAddress(address: string): string {
    if (!address || address.length <= 10) return address;
    return address.substring(0, 10) + '****';
  }

  /**
   * 根据类型执行脱敏
   */
  static mask(value: string, type: SensitiveType): string {
    if (!value) return value;

    switch (type) {
      case SensitiveType.PHONE:
        return this.maskPhone(value);
      case SensitiveType.EMAIL:
        return this.maskEmail(value);
      case SensitiveType.ID_CARD:
        return this.maskIdCard(value);
      case SensitiveType.BANK_CARD:
        return this.maskBankCard(value);
      case SensitiveType.NAME:
        return this.maskName(value);
      case SensitiveType.ADDRESS:
        return this.maskAddress(value);
      default:
        return value;
    }
  }
}
