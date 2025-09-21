import { v4 as uuidv4 } from 'uuid';

export class AccountId {
  private constructor(private readonly value: string) {
    this.ensureValidFormat(value);
  }

  static fromString(value: string): AccountId {
    return new AccountId(value);
  }

  static generate(): AccountId {
    return new AccountId(`acc_${uuidv4()}`);
  }

  private ensureValidFormat(value: string): void {
    if (!value) throw new Error('Invalid AccountId: empty');
    if (!value.startsWith('acc_')) throw new Error('Invalid AccountId prefix');
    const id = value.slice(4);
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id))
      throw new Error('Invalid AccountId format: expected acc_<uuid-v4>');
  }

  getValue(): string {
    return this.value;
  }

  equals(other: AccountId): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}
