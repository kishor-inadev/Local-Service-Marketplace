import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
	Inject,
	LoggerService,
	HttpCode,
	HttpStatus,
	UseGuards,
	Delete,
} from "@nestjs/common";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { EventService } from "../services/event.service";
import { CreateEventDto } from "../dto/create-event.dto";
import { EventQueryDto } from "../dto/event-query.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@Controller("events")
export class EventController {
	constructor(
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
		private readonly eventService: EventService,
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createEvent(@Body() createEventDto: CreateEventDto) {
		this.logger.log(`POST /events - Create event: ${createEventDto.eventType}`, "EventController");

		const event = await this.eventService.createEvent(createEventDto);

		return event;
	}

	@Get()
	async getAllEvents(@Query() queryDto: EventQueryDto) {
		this.logger.log("GET /events - Retrieve all events", "EventController");

		return this.eventService.getAllEvents(queryDto);
	}

	@Get("type/:eventType")
	async getEventsByType(@Param("eventType") eventType: string, @Query("limit") limit?: string) {
		this.logger.log(`GET /events/type/${eventType} - Retrieve events by type`, "EventController");

		const parsedLimit = limit ? parseInt(limit, 10) : 100;
		return this.eventService.getEventsByType(eventType, parsedLimit);
	}

	@Get(":id")
	async getEventById(@Param("id", FlexibleIdPipe) id: string) {
		this.logger.log(`GET /events/${id} - Retrieve event by ID`, "EventController");

		const event = await this.eventService.getEventById(id);

		return event;
	}
}
