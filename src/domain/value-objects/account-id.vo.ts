export class AccountId {
  constructor(private readonly value: string) {
    this.ensureValidFormat(value);
  }

  private ensureValidFormat(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('AccountId cannot be empty');
    }
    if (!value.startsWith('acc_')) {
      throw new Error('Invalid AccountId format');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: AccountId): boolean {
    return this.value === other.getValue();
  }
}
