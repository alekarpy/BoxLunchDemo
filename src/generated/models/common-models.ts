export interface IOperationOptions {
  filter?: string;
  orderBy?: string;
  top?: number;
  skip?: number;
}

export type IGetAllOptions = IOperationOptions;

export const _IGetAllOptions = 'IGetAllOptions' as const;