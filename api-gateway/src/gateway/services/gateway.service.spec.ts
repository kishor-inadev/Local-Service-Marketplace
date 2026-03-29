import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { of, throwError } from 'rxjs';
import { GatewayService } from '../services/gateway.service';
import {
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '../../common/exceptions/http.exceptions';

describe('GatewayService', () => {
  let service: GatewayService;
  let httpService: HttpService;
  let logger: any;

  const mockHttpService = {
    request: jest.fn(),
    get: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewayService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<GatewayService>(GatewayService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get(WINSTON_MODULE_NEST_PROVIDER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('forwardRequest', () => {
    it('should forward request to correct microservice', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: {},
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      const result = await service.forwardRequest(
				"/user/auth/login",
				"POST",
				{ email: "test@example.com", password: "password" },
				{ "content-type": "application/json" },
				{},
			);

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ success: true });
      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: expect.stringContaining('/auth/login'),
        }),
      );
    });

    it('should throw ServiceUnavailableException on ECONNREFUSED', async () => {
      const error = new Error('ECONNREFUSED');
      (error as any).code = 'ECONNREFUSED';

      mockHttpService.request.mockReturnValue(throwError(() => error));

      await expect(service.forwardRequest("/user/auth/login", "POST")).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw GatewayTimeoutException on timeout', async () => {
      const error = new Error('timeout of 30000ms exceeded');
      (error as any).code = 'ETIMEDOUT';

      mockHttpService.request.mockReturnValue(throwError(() => error));

      await expect(service.forwardRequest("/user/auth/login", "POST")).rejects.toThrow(GatewayTimeoutException);
    });

    it('should sanitize headers before forwarding', async () => {
      const mockResponse = {
        status: 200,
        data: {},
        headers: {},
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      await service.forwardRequest(
				"/user/auth/me",
				"GET",
				undefined,
				{ host: "localhost:3000", connection: "keep-alive", authorization: "Bearer token" },
				{},
			);

      const requestConfig = mockHttpService.request.mock.calls[0][0];
      expect(requestConfig.headers.host).toBeUndefined();
      expect(requestConfig.headers.connection).toBeUndefined();
      expect(requestConfig.headers.authorization).toBe('Bearer token');
    });

    it('should throw ServiceUnavailableException for unmapped routes', async () => {
      await expect(
        service.forwardRequest('/unknown/route', 'GET'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('healthCheck', () => {
    it('should return health status of all services', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          status: 200,
          data: { status: 'healthy' },
          headers: { 'x-response-time': '45ms' },
        }),
      );

      const result = await service.healthCheck();

    expect(result).toHaveProperty("identity-service");
		expect(result["identity-service"].status).toBe("healthy");
    });

    it('should mark service as unhealthy on error', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Connection failed')),
      );

      const result = await service.healthCheck();

    expect(result["identity-service"].status).toBe("unhealthy");
		expect(result["identity-service"].error).toBe("Connection failed");
    });
  });
});
