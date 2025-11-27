declare module "react-select" {
  import { ComponentType, ReactNode } from "react";

  export interface StylesConfig<Option = any, IsMulti extends boolean = false> {
    [key: string]: (base: any, state: any) => any;
  }

  export interface ThemeConfig {
    (theme: any): any;
  }

  export interface OptionTypeBase {
    [key: string]: any;
  }

  export interface Props<
    Option = OptionTypeBase,
    IsMulti extends boolean = false
  > {
    options?: Option[];
    value?: IsMulti extends true ? Option[] : Option | null;
    onChange?: (
      newValue: IsMulti extends true ? Option[] : Option | null
    ) => void;
    placeholder?: string;
    isSearchable?: boolean;
    isMulti?: IsMulti;
    className?: string;
    classNamePrefix?: string;
    styles?: StylesConfig<Option, IsMulti>;
    theme?: ThemeConfig;
    [key: string]: any;
  }

  export default function Select<
    Option = OptionTypeBase,
    IsMulti extends boolean = false
  >(props: Props<Option, IsMulti>): JSX.Element;
}
