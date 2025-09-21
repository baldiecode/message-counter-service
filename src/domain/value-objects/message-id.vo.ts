export class MessageId {
  constructor(private readonly value: string) {
    this.ensureValidFormat(value);
  }

  private ensureValidFormat(value: string): void {
    if (!value || !value.startsWith('msg_')) {
      throw new Error('Invalid MessageId format');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: MessageId): boolean {
    return this.value === other.getValue();
  }
}
