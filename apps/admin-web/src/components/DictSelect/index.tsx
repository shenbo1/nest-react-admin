import React from 'react';
import { Spin } from 'antd';
import {
  ProFormSelect,
  ProFormCheckbox,
  ProFormRadio,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { dictApi } from '@/services/system/system';

/**
 * 将 TypeScript enum 转换为 options 数组
 * @param enumObj TypeScript enum 对象
 * @returns 转换后的 options 数组
 */
function enumToOptions(
  enumObj: any,
): { label: string; value: string | number }[] {
  const options: { label: string; value: string | number }[] = [];
  const processedKeys = new Set<string>();

  // 遍历所有条目
  for (const [key, value] of Object.entries(enumObj)) {
    // 跳过数字键（TypeScript 数字枚举的反向映射）
    if (!isNaN(Number(key))) {
      continue;
    }

    // 如果已经处理过这个值，跳过（避免重复）
    const valueStr = String(value);
    if (processedKeys.has(valueStr)) {
      continue;
    }
    processedKeys.add(valueStr);

    // 添加到选项数组
    options.push({
      label: key, // 使用键名作为标签（中文）
      value: value as string | number, // 使用枚举值作为值
    });
  }

  return options;
}

// 公共属性
interface CommonDictProps {
  dictType?: string; // 字典类型（与options二选一）
  options?: { label: string; value: string | number }[]; // 静态枚举选项（与dictType二选一）
  enum?: object; // TypeScript enum 对象
  loading?: boolean;
}

// Select组件属性 - 使用ProFormSelect
interface DictSelectProps
  extends
    CommonDictProps,
    Omit<
      React.ComponentProps<typeof ProFormSelect>,
      'options' | 'loading' | 'onChange'
    > {
  type?: 'select';
  onChange?: (
    value: unknown,
    option?:
      | { label: string; value: string | number }
      | { label: string; value: string | number }[]
      | undefined,
  ) => void;
}

// CheckboxGroup组件属性 - 使用ProFormCheckbox
interface DictCheckboxProps
  extends
    CommonDictProps,
    Omit<
      React.ComponentProps<typeof ProFormCheckbox.Group>,
      'options' | 'loading' | 'onChange'
    > {
  type?: 'checkbox';
  onChange?: (checkedValue: unknown[]) => void;
}

// RadioGroup组件属性 - 使用ProFormRadio
interface DictRadioProps
  extends
    CommonDictProps,
    Omit<
      React.ComponentProps<typeof ProFormRadio.Group>,
      'options' | 'loading' | 'onChange'
    > {
  type?: 'radio';
  onChange?: (
    value: unknown,
    option?:
      | { label: string; value: string | number }
      | { label: string; value: string | number }[]
      | undefined,
  ) => void;
}

// 联合类型
type DictComponentProps = DictSelectProps | DictCheckboxProps | DictRadioProps;

/**
 * 字典选择器组件
 * 支持 Select、CheckboxGroup、RadioGroup 三种形式
 * 自动从字典服务获取数据
 */
const DictComponent: React.FC<DictComponentProps> = (props) => {
  const { dictType, type = 'select', onChange, ...restProps } = props;

  // 从字典API获取数据
  const { data: dictOptions = [], isLoading } = useQuery({
    queryKey: [`dict_${dictType}`],
    queryFn: () => dictApi.getDataByType(dictType!),
    enabled: !!dictType, // 只有当dictType存在时才请求
  });


  // 优先使用传入的options作为静态枚举
  // 或者如果有enum对象则转换它，最后使用从API获取的字典数据
  let options = props.options;

  if (!options && props.enum) {
    console.log('Converting enum:', props.enum);
    console.log('Enum entries:', Object.entries(props.enum));
    options = enumToOptions(props.enum);
    console.log('Converted options:', options);
  }

  if (!options && dictType) {
    options = dictOptions.map((item) => ({
      label: item.label,
      value: item.value, // 保持从API获取的原始类型（可能是 number）
    }));
  }

  // 确保 options 不为 undefined
  options = options || [];

  // 根据类型渲染不同的组件
  switch (type) {
    case 'checkbox':
      return (
        <div>
          {isLoading ? <Spin /> : null}
          <ProFormCheckbox.Group
            options={options}
            onChange={onChange as any}
            {...(restProps as DictCheckboxProps)}
          />
        </div>
      );

    case 'radio':
      return (
        <div>
          {isLoading ? <Spin /> : null}
          <ProFormRadio.Group
            options={options}
            onChange={onChange as any}
            {...(restProps as DictRadioProps)}
          />
        </div>
      );

    case 'select':
    default:
      return (
        <ProFormSelect
          options={options}
          onChange={onChange as any}
          loading={isLoading}
          {...(restProps as DictSelectProps)}
        />
      );
  }
};

// 导出不同类型的快捷组件
export const DictSelect = (props: DictSelectProps) => (
  <DictComponent {...props} type="select" />
);
export const DictCheckbox = (props: DictCheckboxProps) => (
  <DictComponent {...props} type="checkbox" />
);
export const DictRadio = (props: DictRadioProps) => (
  <DictComponent {...props} type="radio" />
);

export default DictComponent;
