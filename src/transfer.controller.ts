import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Get,
  Post,
} from '@nestjs/common'
import { TransferService } from './transfer.service'
import { TransferError } from './errors/TransferError'

interface TransferInterface {
  fromUserId: string
  toUserId: string
  amount: number
}

@Controller('transfer')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Get()
  getHelloTransfer(): string {
    return this.transferService.getHelloTransfer()
  }

  @Post()
  async transferFunds(@Body() transferData: TransferInterface) {
    const { fromUserId, toUserId, amount } = transferData

    if (!fromUserId || !toUserId || !amount) {
      throw new HttpException(
        {
          error: 'Missing required fields: fromUserId, toUserId, amount',
        },
        HttpStatus.BAD_REQUEST
      )
    }

    if (amount <= 0) {
      throw new HttpException(
        {
          error: 'Sum must be positive and must be number',
        },
        HttpStatus.BAD_REQUEST
      )
    }

    try {
      const resultTransfer = await this.transferService.transferStandart(
        fromUserId,
        toUserId,
        amount
      )

      return { message: 'Transfer successful', result: resultTransfer }
    } catch (error: any) {
      if (error instanceof TransferError) {
        throw new HttpException(
          {
            error: error.message,
            errorCode: error.errorCode,
          },
          error.statusCode
        )
      }
      throw new HttpException(
        {
          error: 'Ошибка при выполнении перевода',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
