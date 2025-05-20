import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { UserService } from './user.service'

interface UpdateBalanceData {
  userId: string
  newBalance: number
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/update-balance')
  async updateBalance(@Body() updateBalanceData: UpdateBalanceData) {
    const { userId, newBalance } = updateBalanceData

    try {
      await this.userService.updateBalance(userId, newBalance)
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
