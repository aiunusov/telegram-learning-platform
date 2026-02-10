import { Global, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventDispatcherService } from './event-dispatcher.service';

@Global()
@Module({
  providers: [EventsService, EventDispatcherService],
  exports: [EventsService, EventDispatcherService],
})
export class EventsModule {}
