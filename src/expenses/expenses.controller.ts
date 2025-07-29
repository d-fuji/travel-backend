import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, CreateBudgetDto } from './dto/expenses.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) { }

  // Expense Categories
  @Get('expense-categories')
  async getAllCategories() {
    return this.expensesService.getAllCategories();
  }

  // Expenses
  @Get('expenses')
  async getExpensesByTravel(@Query('travelId') travelId: string) {
    if (!travelId) {
      throw new NotFoundException('travelId query parameter is required');
    }
    return this.expensesService.getExpensesByTravel(travelId);
  }

  @Post('travels/:travelId/expenses')
  async createExpense(
    @Param('travelId') travelId: string,
    @Body() createExpenseDto: CreateExpenseDto,
    @Request() req,
  ) {

    const userId = req.user?.id
    return this.expensesService.createExpense(
      travelId,
      createExpenseDto,
      userId,
    );
  }

  @Patch('expenses/:id')
  async updateExpense(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req,
  ) {
    const userId = req.user?.id
    return this.expensesService.updateExpense(id, updateExpenseDto, userId);
  }

  @Delete('expenses/:id')
  async deleteExpense(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id;
    return this.expensesService.deleteExpense(id, userId);
  }

  // Budgets
  @Get('budgets')
  async getBudgetByTravel(@Query('travelId') travelId: string) {
    if (!travelId) {
      throw new NotFoundException('travelId query parameter is required');
    }
    return this.expensesService.getBudgetByTravel(travelId);
  }

  @Post('travels/:travelId/budgets')
  async createOrUpdateBudget(
    @Param('travelId') travelId: string,
    @Body() createBudgetDto: CreateBudgetDto,
    @Request() req,
  ) {
    const userId = req.user?.id;
    return this.expensesService.createOrUpdateBudget(
      travelId,
      createBudgetDto,
      userId,
    );
  }

  // Analytics
  @Get('travels/:travelId/expense-analytics')
  async getExpenseAnalytics(@Param('travelId') travelId: string) {
    return this.expensesService.getExpenseAnalytics(travelId);
  }
}