import {
  IsISO8601,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { registerDecorator } from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'DateRange', async: false })
export class DateRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as GetCountsQueryDto;
    const fromDate = new Date(object.from);
    const toDate = new Date(object.to);

    if (fromDate >= toDate) {
      return false;
    }

    const daysDifference = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysDifference <= 30;
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as GetCountsQueryDto;
    const fromDate = new Date(object.from);
    const toDate = new Date(object.to);

    if (fromDate >= toDate) {
      return 'from must be before to';
    }

    const daysDifference = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return `Range cannot exceed 30 days, current: ${daysDifference} days`;
  }
}

export class GetCountsQueryDto {
  @ApiProperty({
    description: 'Account identifier (UUID-like string prefixed with acc_)',
    example: 'acc_11111111-1111-4111-8111-111111111111',
  })
  @IsString()
  account_id!: string;

  @ApiProperty({
    description: 'Start of the time range (ISO 8601)',
    example: '2025-09-18T10:00:00Z',
    format: 'date-time',
  })
  @IsISO8601()
  from!: string;

  @ApiProperty({
    description: 'End of the time range (ISO 8601)',
    example: '2025-09-18T12:00:00Z',
    format: 'date-time',
  })
  @IsISO8601()
  to!: string;

  // Hidden from Swagger; used only to trigger custom DateRange validation
  @ApiHideProperty()
  @Validate(DateRangeConstraint)
  range!: string; // Dummy field for validation
}
