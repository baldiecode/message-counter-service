export class DayBucket {
  private constructor(private readonly value: string) {
    this.ensureValidFormat(value);
  }

  /**
   * Create a DayBucket from a Date, using UTC and truncating to 00:00:00Z.
   * Canonical string format: YYYY-MM-DD (UTC calendar day).
   */
  static fromDate(date: Date): DayBucket {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid Date provided to DayBucket.fromDate');
    }
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const day = `${y}-${m}-${d}`;
    return new DayBucket(day);
  }

  /**
   * Create a DayBucket from a canonical string (YYYY-MM-DD).
   * Interpreted strictly as a UTC calendar day (no time component).
   */
  static fromString(value: string): DayBucket {
    return new DayBucket(value);
  }

  /**
   * Current UTC day bucket.
   */
  static todayUTC(): DayBucket {
    return DayBucket.fromDate(new Date());
  }

  private ensureValidFormat(value: string): void {
    if (!value) throw new Error('Invalid DayBucket: empty');
    // Canonical UTC calendar day string: YYYY-MM-DD
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(value)) {
      throw new Error('Invalid DayBucket format. Expected YYYY-MM-DD');
    }
    // Basic validation by parsing
    const parsed = new Date(`${value}T00:00:00Z`);
    if (isNaN(parsed.getTime())) {
      throw new Error('Invalid DayBucket value (non-existent date)');
    }
  }

  /**
   * Convert to a Date at 00:00:00Z of the represented UTC day.
   */
  toDate(): Date {
    // Safe because format is validated.
    return new Date(`${this.value}T00:00:00Z`);
  }

  /**
   * Canonical string value (YYYY-MM-DD).
   */
  getValue(): string {
    return this.value;
  }

  equals(other: DayBucket): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}
