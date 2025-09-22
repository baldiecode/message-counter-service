import { Body, Controller, Post } from '@nestjs/common';

@Controller('mock')
export class MockExternalController {
  @Post('daily-total')
  receive(@Body() body: any) {
    // Simple echo for local testing
    return { status: 'received', payload: body };
  }
}
