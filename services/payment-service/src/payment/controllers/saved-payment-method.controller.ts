import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  ParseUUIDPipe,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { SavedPaymentMethodService } from "../services/saved-payment-method.service";
import { SavePaymentMethodDto } from "../dto/save-payment-method.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("payment-methods")
export class SavedPaymentMethodController {
  constructor(
    private readonly paymentMethodService: SavedPaymentMethodService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async savePaymentMethod(
    @Body() dto: SavePaymentMethodDto,
    @Request() req: any,
  ) {
    // Ensure user_id matches authenticated user
    dto.user_id = req.user.userId;

    const paymentMethod =
      await this.paymentMethodService.savePaymentMethod(dto);

    return {
      success: true,
      data: paymentMethod,
      message: "Payment method saved successfully",
    };
  }

  @Get()
  async getUserPaymentMethods(@Request() req: any) {
    const methods = await this.paymentMethodService.getUserPaymentMethods(
      req.user.userId,
    );

    return {
      data: methods,
      total: methods.length,
      page: 1,
      limit: methods.length || 1,
    };
  }

  @Get("default")
  async getDefaultPaymentMethod(@Request() req: any) {
    const method = await this.paymentMethodService.getDefaultPaymentMethod(
      req.user.userId,
    );

    return {
      success: true,
      data: method,
      message: "Default payment method retrieved successfully",
    };
  }

  @Get("expiring")
  async getExpiringCards(@Request() req: any) {
    const expiringCards = await this.paymentMethodService.getExpiringCards(
      req.user.userId,
      2, // 2 months ahead
    );

    return {
      data: expiringCards,
      total: expiringCards.length,
      page: 1,
      limit: expiringCards.length || 1,
    };
  }

  @Get(":methodId")
  async getPaymentMethod(
    @Param("methodId", ParseUUIDPipe) methodId: string,
    @Request() req: any,
  ) {
    const method = await this.paymentMethodService.getPaymentMethodById(
      methodId,
      req.user.userId,
    );

    return {
      success: true,
      data: method,
      message: "Payment method retrieved successfully",
    };
  }

  @Put(":methodId/set-default")
  async setDefaultPaymentMethod(
    @Param("methodId", ParseUUIDPipe) methodId: string,
    @Request() req: any,
  ) {
    const method = await this.paymentMethodService.setDefaultPaymentMethod(
      methodId,
      req.user.userId,
    );

    return {
      success: true,
      data: method,
      message: "Default payment method updated",
    };
  }

  @Delete(":methodId")
  async deletePaymentMethod(
    @Param("methodId", ParseUUIDPipe) methodId: string,
    @Request() req: any,
  ) {
    await this.paymentMethodService.deletePaymentMethod(
      methodId,
      req.user.userId,
    );

    return {
      success: true,
      message: "Payment method deleted successfully",
    };
  }
}
