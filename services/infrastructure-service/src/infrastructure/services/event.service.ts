import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { EventRepository } from '../repositories/event.repository';
import { CreateEventDto } from '../dto/create-event.dto';
import { Event } from '../entities/event.entity';
import { EventQueryDto } from "../dto/event-query.dto";
import { resolvePagination, validateDateRange } from "../../common/pagination/list-query-validation.util";

@Injectable()
export class EventService {
	constructor(
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
		private readonly eventRepository: EventRepository,
	) { }

	async createEvent(createEventDto: CreateEventDto): Promise<Event> {
		try {
			const event = await this.eventRepository.createEvent(createEventDto);

			this.logger.log(`Event created: ${createEventDto.eventType} (ID: ${event.id})`, "EventService");

			return event;
		} catch (error: any) {
			this.logger.error(`Failed to create event: ${error.message}`, error.stack, "EventService");
			throw error;
		}
	}

	async getAllEvents(queryDto: EventQueryDto): Promise<{ data: Event[]; total: number; page: number; limit: number }> {
		try {
			validateDateRange(queryDto.createdFrom, queryDto.createdTo, "createdAt");
			const pagination = resolvePagination(queryDto, { page: 1, limit: 100 });
			const [data, total] = await Promise.all([
				this.eventRepository.findEvents(queryDto, pagination),
				this.eventRepository.countEvents(queryDto),
			]);

			this.logger.log(`Retrieved ${data.length} events`, "EventService");

			return { data, total, page: pagination.page, limit: pagination.limit };
		} catch (error: any) {
			this.logger.error(`Failed to get events: ${error.message}`, error.stack, "EventService");
			throw error;
		}
	}

	async getEventById(id: string): Promise<Event | null> {
		try {
			const event = await this.eventRepository.getEventById(id);

			this.logger.log(`Retrieved event by ID: ${id}`, "EventService");

			return event;
		} catch (error: any) {
			this.logger.error(`Failed to get event by ID: ${error.message}`, error.stack, "EventService");
			throw error;
		}
	}

	async getEventsByType(
		eventType: string,
		limit: number = 100,
	): Promise<{ data: Event[]; total: number; page: number; limit: number }> {
		return this.getAllEvents({ eventType, limit, page: 1 });
	}
}
