import { Controller, Get, Post, Body, Param, Query, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { EventService } from '../services/event.service';
import { CreateEventDto } from '../dto/create-event.dto';

@Controller('events')
export class EventController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly eventService: EventService,
  ) {}

  @Post()
  async createEvent(@Body() createEventDto: CreateEventDto) {
    this.logger.log(
      `POST /events - Create event: ${createEventDto.eventType}`,
      'EventController',
    );

    const event = await this.eventService.createEvent(createEventDto);

    return event;
  }

  @Get()
  async getAllEvents(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log(
      'GET /events - Retrieve all events',
      'EventController',
    );

    const parsedLimit = limit ? parseInt(limit) : 100;
    const parsedOffset = offset ? parseInt(offset) : 0;

    const result = await this.eventService.getAllEvents(
      parsedLimit,
      parsedOffset,
    );

    return { data: result.data, total: result.total };
  }

  @Get(':id')
  async getEventById(@Param('id') id: string) {
    this.logger.log(
      `GET /events/${id} - Retrieve event by ID`,
      'EventController',
    );

    const event = await this.eventService.getEventById(id);

    return event;
  }

  @Get('type/:eventType')
  async getEventsByType(
    @Param('eventType') eventType: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log(
      `GET /events/type/${eventType} - Retrieve events by type`,
      'EventController',
    );

    const parsedLimit = limit ? parseInt(limit) : 100;
    const data = await this.eventService.getEventsByType(eventType, parsedLimit);

    return data;
  }
}
