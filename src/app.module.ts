import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TransferController } from './transfer.controller'
import { TransferService } from './transfer.service'
import { UpdateManuallyController } from './updateManually.controller'
import { UpdateManuallyService } from './updateManually.service'

@Module({
  imports: [],
  controllers: [AppController, TransferController, UpdateManuallyController],
  providers: [AppService, TransferService, UpdateManuallyService],
})
export class AppModule {}
