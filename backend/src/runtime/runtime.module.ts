import { Module } from '@nestjs/common';
import { RuntimeController } from './runtime.controller';
import { RuntimeService } from './runtime.service';
import { StateMachineService } from './state-machine.service';
import { AiCoreModule } from '../ai-core/ai-core.module';

@Module({
  imports: [AiCoreModule],
  controllers: [RuntimeController],
  providers: [RuntimeService, StateMachineService],
  exports: [RuntimeService, StateMachineService],
})
export class RuntimeModule {}
