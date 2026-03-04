export interface TotemProps {
  id: string;
  name: string;
  accessCode: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  lastHeartbeat?: Date | null;
}

export class TotemEntity {
  private constructor(private readonly props: TotemProps) {}

  static create(props: TotemProps): TotemEntity {
    return new TotemEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get accessCode(): string {
    return this.props.accessCode;
  }

  get status(): string {
    return this.props.status;
  }

  get lastHeartbeat(): Date | null | undefined {
    return this.props.lastHeartbeat;
  }

  isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  canAuthenticate(): boolean {
    return this.isActive();
  }
}
