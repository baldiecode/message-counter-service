export class MessageId {
  constructor(private readonly value: string) {
    this.ensureValidFormat(value);
  }

  private ensureValidFormat(value: string): void {
    if (!value) throw new Error('Invalid MessageId format');
    const trimmed = value.trim();
    // Accept IDs like: msg_01HX9FZ2E0KJ8C3Q9XP (alphanumeric, 5+ chars after prefix)
    const re = /^msg_[A-Za-z0-9]{5,}$/;
    if (!re.test(trimmed)) {
      throw new Error('Invalid MessageId format');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: MessageId): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}
