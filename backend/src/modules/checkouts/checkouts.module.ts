import { Module } from '@nestjs/common';
import { CheckoutsController } from './checkouts.controller';
import { CheckoutsRepository } from './checkouts.repository';
import { CheckoutsService } from './checkouts.service';
@Module({
  controllers: [CheckoutsController],
  providers: [CheckoutsRepository, CheckoutsService],
})
export class CheckoutsModule {}
