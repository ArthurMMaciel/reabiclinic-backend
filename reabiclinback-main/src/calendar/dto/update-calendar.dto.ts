import { PartialType } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';

export class UpdateCalendarDto extends PartialType(CreateEventDto) {}
