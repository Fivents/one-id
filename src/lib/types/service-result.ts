export type ServiceResult<T = void> =
  | {
      success: true;
      data?: T;
    }
  | {
      success: false;
      error: string;
    };
