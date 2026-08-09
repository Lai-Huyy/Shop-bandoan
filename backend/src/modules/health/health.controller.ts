import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check API and dependency availability' })
  @ApiOkResponse({ description: 'API, PostgreSQL, and Redis are available' })
  @ApiServiceUnavailableResponse({
    description: 'One or more required services are unavailable',
  })
  check() {
    return this.healthService.check();
  }
}
