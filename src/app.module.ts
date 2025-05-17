import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TransferController } from './transfer/transfer.controller'
import { TransferService } from './transfer/transfer.service'
import { UserController } from './user/user.controller'
import { UserService } from './user/user.service'

@Module({
  imports: [],
  controllers: [AppController, TransferController, UserController],
  providers: [AppService, TransferService, UserService],
})
export class AppModule {}
