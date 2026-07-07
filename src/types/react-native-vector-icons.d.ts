declare module 'react-native-vector-icons/MaterialIcons' {
  import type { ComponentType } from 'react';
  import type { TextProps } from 'react-native';

  type IconProps = TextProps & {
    name: string;
    size?: number;
    color?: string;
  };

  const Icon: ComponentType<IconProps>;
  export default Icon;
}
