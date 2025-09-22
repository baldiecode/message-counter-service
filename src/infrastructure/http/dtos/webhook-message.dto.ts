import { IsISO8601, IsObject, IsOptional, IsString } from 'class-validator';

export class WebhookMessageDto {
  @IsString()
  message_id!: string;

  @IsString()
  account_id!: string;

  @IsISO8601()
  created_at!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
