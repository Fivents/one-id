import { BaseEntity } from './base.entity';

export type PrintOrientation = 'PORTRAIT' | 'LANDSCAPE';

export interface PrintConfigProps {
  id: string;
  paperWidth: number;
  paperHeight: number;
  orientation: PrintOrientation;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  showFiventsLogo: boolean;
  fiventsLogoPosition: string;
  fiventsLogoSize: number;
  showOrgLogo: boolean;
  orgLogoPosition: string;
  orgLogoSize: number;
  showQrCode: boolean;
  qrCodePosition: string;
  qrCodeSize: number;
  qrCodeContent: string;
  showName: boolean;
  namePosition: string;
  nameFontSize: number;
  nameBold: boolean;
  showCompany: boolean;
  companyPosition: string;
  companyFontSize: number;
  showJobTitle: boolean;
  jobTitlePosition: string;
  jobTitleFontSize: number;
  itemsOrder: string;
  printerDpi: number;
  printerType: string;
  printSpeed: number;
  copies: number;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
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

  get marginTop(): number {
    return this.props.marginTop;
  }

  get marginRight(): number {
    return this.props.marginRight;
  }

  get marginBottom(): number {
    return this.props.marginBottom;
  }

  get marginLeft(): number {
    return this.props.marginLeft;
  }

  get showFiventsLogo(): boolean {
    return this.props.showFiventsLogo;
  }

  get fiventsLogoPosition(): string {
    return this.props.fiventsLogoPosition;
  }

  get fiventsLogoSize(): number {
    return this.props.fiventsLogoSize;
  }

  get showOrgLogo(): boolean {
    return this.props.showOrgLogo;
  }

  get orgLogoPosition(): string {
    return this.props.orgLogoPosition;
  }

  get orgLogoSize(): number {
    return this.props.orgLogoSize;
  }

  get showQrCode(): boolean {
    return this.props.showQrCode;
  }

  get qrCodePosition(): string {
    return this.props.qrCodePosition;
  }

  get qrCodeSize(): number {
    return this.props.qrCodeSize;
  }

  get qrCodeContent(): string {
    return this.props.qrCodeContent;
  }

  get showName(): boolean {
    return this.props.showName;
  }

  get namePosition(): string {
    return this.props.namePosition;
  }

  get nameFontSize(): number {
    return this.props.nameFontSize;
  }

  get nameBold(): boolean {
    return this.props.nameBold;
  }

  get showCompany(): boolean {
    return this.props.showCompany;
  }

  get companyPosition(): string {
    return this.props.companyPosition;
  }

  get companyFontSize(): number {
    return this.props.companyFontSize;
  }

  get showJobTitle(): boolean {
    return this.props.showJobTitle;
  }

  get jobTitlePosition(): string {
    return this.props.jobTitlePosition;
  }

  get jobTitleFontSize(): number {
    return this.props.jobTitleFontSize;
  }

  get itemsOrder(): string {
    return this.props.itemsOrder;
  }

  get printerDpi(): number {
    return this.props.printerDpi;
  }

  get printerType(): string {
    return this.props.printerType;
  }

  get printSpeed(): number {
    return this.props.printSpeed;
  }

  get copies(): number {
    return this.props.copies;
  }

  get backgroundColor(): string {
    return this.props.backgroundColor;
  }

  get textColor(): string {
    return this.props.textColor;
  }

  get fontFamily(): string {
    return this.props.fontFamily;
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

  totalMarginHorizontal(): number {
    return this.props.marginLeft + this.props.marginRight;
  }

  totalMarginVertical(): number {
    return this.props.marginTop + this.props.marginBottom;
  }

  printableWidth(): number {
    return this.props.paperWidth - this.totalMarginHorizontal();
  }

  printableHeight(): number {
    return this.props.paperHeight - this.totalMarginVertical();
  }

  parsedItemsOrder(): string[] {
    try {
      return JSON.parse(this.props.itemsOrder) as string[];
    } catch {
      return [];
    }
  }

  isThermalPrinter(): boolean {
    return this.props.printerType === 'thermal';
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }
}
