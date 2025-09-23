import { IsISO8601, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookMessageDto {
  @ApiProperty({
    description: 'Unique identifier of the message',
    example: 'msg_01HX9FZ2E0KJ8C3Q9XP',
  })
  @IsString()
  message_id!: string;

  @ApiProperty({
    description: 'Account identifier (UUID-like string prefixed with acc_)',
    example: 'acc_11111111-1111-4111-8111-111111111111',
  })
  @IsString()
  account_id!: string;

  @ApiProperty({
    description: 'Creation timestamp in ISO 8601 format',
    example: '2025-09-18T10:00:00Z',
    format: 'date-time',
  })
  @IsISO8601()
  created_at!: string;

  @ApiPropertyOptional({
    description: 'Arbitrary metadata associated with the message',
    type: 'object',
    additionalProperties: true,
    example: { source: 'whatsapp', channel: 'inbound' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
