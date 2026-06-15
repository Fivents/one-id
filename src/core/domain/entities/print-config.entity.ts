import { BaseEntity } from './base.entity';

export type PrintOrientation = 'PORTRAIT' | 'LANDSCAPE';

export type QrCodeContentType = 'participant_id' | 'access_code' | 'qr_code_value';

export interface PrintConfigProps {
  id: string;
  paperWidth: number;
  paperHeight: number;
  orientation: PrintOrientation;
  printerDpi: number;
  copies: number;
  qrCodeContent: QrCodeContentType;
  showQrCode: boolean;
  showAccessCode: boolean;
  fontSizeName: number;
  fontSizeMeta: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PrintConfigEntity extends BaseEntity {
  private constructor(private readonly props: PrintConfigProps) {
    super(props.id);
  }

  static create(props: PrintConfigProps): PrintConfigEntity {
    return new PrintConfigEntity(props);
  }

  get paperWidth(): number {
    return this.props.paperWidth;
  }

  get paperHeight(): number {
    return this.props.paperHeight;
  }

  get orientation(): PrintOrientation {
    return this.props.orientation;
  }

  get printerDpi(): number {
    return this.props.printerDpi;
  }

  get copies(): number {
    return this.props.copies;
  }

  get qrCodeContent(): QrCodeContentType {
    return this.props.qrCodeContent;
  }

  get showQrCode(): boolean {
    return this.props.showQrCode;
  }

  get showAccessCode(): boolean {
    return this.props.showAccessCode;
  }

  get fontSizeName(): number {
    return this.props.fontSizeName;
  }

  get fontSizeMeta(): number {
    return this.props.fontSizeMeta;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isLandscape(): boolean {
    return this.props.orientation === 'LANDSCAPE';
  }

  isPortrait(): boolean {
    return this.props.orientation === 'PORTRAIT';
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }
}
