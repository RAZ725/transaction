import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { UpdateManuallyService } from './updateManually.service'

interface UpdateBalanceData {
  userId: string
  newBalance: number
}

@Controller('update')
export class UpdateManuallyController {
  constructor(private readonly updateManuallyService: UpdateManuallyService) {}

  @Post()
  async updateBalance(@Body() updateBalanceData: UpdateBalanceData) {
    const { userId, newBalance } = updateBalanceData

    try {
      await this.updateManuallyService.updateBalance(userId, newBalance)
    } catch (error: any) {
      throw new HttpException(
        {
          error: 'Update failed',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
