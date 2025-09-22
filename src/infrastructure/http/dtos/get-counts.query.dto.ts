import {
  IsISO8601,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { registerDecorator } from 'class-validator';

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
  @IsString()
  account_id!: string;

  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;

  @Validate(DateRangeConstraint)
  range!: string; // Dummy field for validation
}
