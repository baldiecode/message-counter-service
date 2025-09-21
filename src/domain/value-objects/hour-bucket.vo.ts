export class HourBucket {
  private constructor(private readonly value: string) {
    this.ensureValidFormat(value);
  }

  static fromDate(date: Date): HourBucket {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid Date provided to HourBucket.fromDate');
    }
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    // Canonical format: YYYY-MM-DDTHH:00:00Z (UTC, truncated to the hour)
    const isoHour = `${y}-${m}-${d}T${h}:00:00Z`;
    return new HourBucket(isoHour);
  }

  static fromString(value: string): HourBucket {
    return new HourBucket(value);
  }

  static nowUTC(): HourBucket {
    return HourBucket.fromDate(new Date());
  }

  private ensureValidFormat(value: string): void {
    if (!value) throw new Error('Invalid HourBucket: empty');
    // Accept only canonical UTC hour buckets: YYYY-MM-DDTHH:00:00Z
    const re = /^\d{4}-\d{2}-\d{2}T\d{2}:00:00Z$/;
    if (!re.test(value)) {
      throw new Error(
        'Invalid HourBucket format. Expected YYYY-MM-DDTHH:00:00Z (UTC)',
      );
    }
    // Validate date components produce a valid date
    const asDate = this.toDate();
    // Rebuild canonical string and ensure it matches exactly, catching invalid dates like 2025-13-40
    const roundTrip = HourBucket.fromDate(asDate).getValue();
    if (roundTrip !== value) {
      throw new Error(
        'Invalid HourBucket value (out-of-range or non-existent date/hour)',
      );
    }
  }

  toDate(): Date {
    // Safe because format is validated
    return new Date(this.value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: HourBucket): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}
