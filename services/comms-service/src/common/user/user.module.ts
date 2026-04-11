import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UserClient } from "./user.client";

@Module({
  imports: [ConfigModule],
  providers: [UserClient],
  exports: [UserClient],
})
export class UserModule {}
