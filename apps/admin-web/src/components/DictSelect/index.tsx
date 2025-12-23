import React from 'react';
import { Select, Checkbox, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { dictApi } from '@/services/system/system';

const { Group: CheckboxGroup } = Checkbox;

// 公共属性
interface CommonDictProps {
  dictType: string; // 字典类型
  loading?: boolean;
}

// Select组件属性
interface DictSelectProps extends CommonDictProps, Omit<React.ComponentProps<typeof Select>, 'options' | 'loading' | 'onChange'> {
  type?: 'select';
  onChange?: (value: unknown, option?: { label: string; value: string } | { label: string; value: string }[] | undefined) => void;
}

// CheckboxGroup组件属性
interface DictCheckboxProps extends CommonDictProps, Omit<React.ComponentProps<typeof CheckboxGroup>, 'options' | 'loading' | 'onChange'> {
  type: 'checkbox';
  onChange?: (checkedValue: unknown[]) => void;
}

// RadioGroup组件属性（扩展）
interface DictRadioProps extends CommonDictProps, Omit<React.ComponentProps<typeof Select>, 'options' | 'loading' | 'mode' | 'onChange'> {
  type: 'radio';
  onChange?: (value: unknown, option?: { label: string; value: string } | { label: string; value: string }[] | undefined) => void;
}

// 联合类型
type DictComponentProps = DictSelectProps | DictCheckboxProps | DictRadioProps;

/**
 * 字典选择器组件
 * 支持 Select、CheckboxGroup、RadioGroup 三种形式
 * 自动从字典服务获取数据
 */
const DictComponent: React.FC<DictComponentProps> = (props) => {
  const {
    dictType,
    type = 'select',
    onChange,
    ...restProps
  } = props;

  // 从字典API获取数据
  const { data: dictOptions = [], isLoading } = useQuery({
    queryKey: [`dict_${dictType}`],
    queryFn: () => dictApi.getDataByType(dictType),
  });

  // 将字典数据转换为组件需要的格式
  const options = dictOptions.map(item => ({
    label: item.label,
    value: item.value,
  }));

  // 根据类型渲染不同的组件
  switch (type) {
    case 'checkbox':
      return (
        <div>
          {isLoading ? <Spin /> : null}
          <CheckboxGroup
            options={options}
            onChange={onChange as any}
            {...(restProps as any)}
          />
        </div>
      );

    case 'radio':
      return (
        <div>
          {isLoading ? <Spin /> : null}
          <Select
            mode="radio"
            options={options}
            onChange={onChange as any}
            loading={isLoading}
            {...(restProps as any)}
          />
        </div>
      );

    case 'select':
    default:
      return (
        <Select
          options={options}
          onChange={onChange as any}
          loading={isLoading}
          {...(restProps as DictSelectProps)}
        />
      );
  }
};

// 导出不同类型的快捷组件
export const DictSelect = (props: DictSelectProps) => <DictComponent {...props} type="select" />;
export const DictCheckbox = (props: DictCheckboxProps) => <DictComponent {...props} type="checkbox" />;
export const DictRadio = (props: DictRadioProps) => <DictComponent {...props} type="radio" />;

export default DictComponent;
