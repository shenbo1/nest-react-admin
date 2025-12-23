const CHINESE_INITIALS: Array<[string, string]> = [
  ["A", "阿"],
  ["B", "芭"],
  ["C", "擦"],
  ["D", "搭"],
  ["E", "蛾"],
  ["F", "发"],
  ["G", "噶"],
  ["H", "哈"],
  ["J", "击"],
  ["K", "喀"],
  ["L", "垃"],
  ["M", "妈"],
  ["N", "拿"],
  ["O", "哦"],
  ["P", "啪"],
  ["Q", "期"],
  ["R", "然"],
  ["S", "撒"],
  ["T", "塌"],
  ["W", "挖"],
  ["X", "昔"],
  ["Y", "压"],
  ["Z", "匝"],
];

const zhCollator = new Intl.Collator("zh-Hans-CN");

const getChineseInitial = (char: string): string => {
  for (let i = CHINESE_INITIALS.length - 1; i >= 0; i -= 1) {
    const [, marker] = CHINESE_INITIALS[i];
    if (zhCollator.compare(char, marker) >= 0) {
      return CHINESE_INITIALS[i][0];
    }
  }
  return "";
};

export const generateKeyFromName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return "";

  const chars = Array.from(trimmed);
  const initials = chars
    .map((char) => {
      if (/[\u4e00-\u9fff]/.test(char)) {
        return getChineseInitial(char);
      }
      if (/[a-z0-9]/i.test(char)) {
        return char.toUpperCase();
      }
      return "";
    })
    .join("");

  return initials;
};
