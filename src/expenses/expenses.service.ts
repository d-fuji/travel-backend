import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto, CreateBudgetDto, UpdateBudgetDto } from './dto/expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) { }

  // Expense Categories
  async getAllCategories() {
    return this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // Expenses
  async getExpensesByTravel(travelId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: { travelId },
      include: {
        category: true,
        payer: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        splits: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        itineraryItem: {
          select: { id: true, title: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Transform to match frontend interface
    return expenses.map(expense => ({
      id: expense.id,
      travelId: expense.travelId,
      amount: expense.amount,
      title: expense.title,
      category: expense.category,
      paidBy: expense.paidBy,
      splitBetween: expense.splits.map(split => split.userId),
      splitMethod: expense.splitMethod,
      customSplits: expense.splitMethod === 'custom'
        ? expense.splits.filter(s => s.amount !== null).map(s => ({ userId: s.userId, amount: s.amount! }))
        : undefined,
      date: expense.date,
      memo: expense.memo,
      receiptImage: expense.receiptImage,
      itineraryItemId: expense.itineraryItemId,
      createdBy: expense.createdBy,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    }));
  }

  async createExpense(travelId: string, createExpenseDto: CreateExpenseDto, userId: string) {
    const { splitBetween, customSplits, ...expenseData } = createExpenseDto;

    // Verify travel exists and user has access
    const travel = await this.prisma.travel.findUnique({
      where: { id: travelId },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!travel) {
      throw new NotFoundException('Travel not found');
    }


    // Check if user is member of travel group or the group creator
    const isMember = travel.group.members.some(member => member.userId === userId) ||
      travel.group.createdBy === userId;

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this travel group');
    }

    // Create expense and splits in transaction
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          ...expenseData,
          travelId,
          createdBy: userId,
          date: new Date(expenseData.date),
        },
        include: {
          category: true,
          payer: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create splits
      const splits = [];
      if (createExpenseDto.splitMethod === 'equal') {
        const equalAmount = createExpenseDto.amount / splitBetween.length;
        for (const userId of splitBetween) {
          splits.push({
            expenseId: expense.id,
            userId,
            amount: equalAmount,
          });
        }
      } else if (createExpenseDto.splitMethod === 'custom' && customSplits) {
        for (const split of customSplits) {
          splits.push({
            expenseId: expense.id,
            userId: split.userId,
            amount: split.amount,
          });
        }
      }

      await tx.expenseSplit.createMany({
        data: splits,
      });

      // Fetch complete expense with splits
      const completeExpense = await tx.expense.findUnique({
        where: { id: expense.id },
        include: {
          category: true,
          payer: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          splits: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          itineraryItem: {
            select: { id: true, title: true },
          },
        },
      });

      return {
        id: completeExpense.id,
        travelId: completeExpense.travelId,
        amount: completeExpense.amount,
        title: completeExpense.title,
        category: completeExpense.category,
        paidBy: completeExpense.paidBy,
        splitBetween: completeExpense.splits.map(split => split.userId),
        splitMethod: completeExpense.splitMethod,
        customSplits: completeExpense.splitMethod === 'custom'
          ? completeExpense.splits.filter(s => s.amount !== null).map(s => ({ userId: s.userId, amount: s.amount! }))
          : undefined,
        date: completeExpense.date,
        memo: completeExpense.memo,
        receiptImage: completeExpense.receiptImage,
        itineraryItemId: completeExpense.itineraryItemId,
        createdBy: completeExpense.createdBy,
        createdAt: completeExpense.createdAt,
        updatedAt: completeExpense.updatedAt,
      };
    });
  }

  async updateExpense(expenseId: string, updateExpenseDto: UpdateExpenseDto, userId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        travel: {
          include: {
            group: {
              include: {
                members: true,
              },
            },
          },
        },
        splits: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Check if user is member of travel group or the group creator
    const isMember = expense.travel.group.members.some(member => member.userId === userId) ||
      expense.travel.group.createdBy === userId;

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this travel group');
    }

    const { splitBetween, customSplits, ...expenseData } = updateExpenseDto;

    return this.prisma.$transaction(async (tx) => {
      // Update expense
      const updatedExpense = await tx.expense.update({
        where: { id: expenseId },
        data: {
          ...expenseData,
          ...(expenseData.date && { date: new Date(expenseData.date) }),
        },
      });

      // Update splits if splitBetween or customSplits changed
      if (splitBetween || customSplits) {
        // Delete existing splits
        await tx.expenseSplit.deleteMany({
          where: { expenseId },
        });

        // Create new splits
        const splits = [];
        const finalSplitBetween = splitBetween || expense.splits.map(s => s.userId);
        const finalSplitMethod = updateExpenseDto.splitMethod || expense.splitMethod;
        const finalAmount = updateExpenseDto.amount || expense.amount;

        if (finalSplitMethod === 'equal') {
          const equalAmount = finalAmount / finalSplitBetween.length;
          for (const userId of finalSplitBetween) {
            splits.push({
              expenseId,
              userId,
              amount: equalAmount,
            });
          }
        } else if (finalSplitMethod === 'custom' && customSplits) {
          for (const split of customSplits) {
            splits.push({
              expenseId,
              userId: split.userId,
              amount: split.amount,
            });
          }
        }

        await tx.expenseSplit.createMany({
          data: splits,
        });
      }

      // Return updated expense with all relations
      const completeExpense = await tx.expense.findUnique({
        where: { id: expenseId },
        include: {
          category: true,
          payer: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          splits: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          itineraryItem: {
            select: { id: true, title: true },
          },
        },
      });

      return {
        id: completeExpense.id,
        travelId: completeExpense.travelId,
        amount: completeExpense.amount,
        title: completeExpense.title,
        category: completeExpense.category,
        paidBy: completeExpense.paidBy,
        splitBetween: completeExpense.splits.map(split => split.userId),
        splitMethod: completeExpense.splitMethod,
        customSplits: completeExpense.splitMethod === 'custom'
          ? completeExpense.splits.filter(s => s.amount !== null).map(s => ({ userId: s.userId, amount: s.amount! }))
          : undefined,
        date: completeExpense.date,
        memo: completeExpense.memo,
        receiptImage: completeExpense.receiptImage,
        itineraryItemId: completeExpense.itineraryItemId,
        createdBy: completeExpense.createdBy,
        createdAt: completeExpense.createdAt,
        updatedAt: completeExpense.updatedAt,
      };
    });
  }

  async deleteExpense(expenseId: string, userId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        travel: {
          include: {
            group: {
              include: {
                members: true,
              },
            },
          },
        },
        splits: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Check if user is member of travel group or the group creator
    const isMember = expense.travel.group.members.some(member => member.userId === userId) ||
      expense.travel.group.createdBy === userId;

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this travel group');
    }

    await this.prisma.expense.delete({
      where: { id: expenseId },
    });

    return { message: 'Expense deleted successfully' };
  }

  // Budgets
  async getBudgetByTravel(travelId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { travelId },
      include: {
        categoryBudgets: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!budget) {
      return null;
    }

    return {
      id: budget.id,
      travelId: budget.travelId,
      totalBudget: budget.totalBudget,
      categoryBudgets: budget.categoryBudgets.map(cb => ({
        categoryId: cb.categoryId,
        amount: cb.amount,
      })),
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  }

  async createOrUpdateBudget(travelId: string, createBudgetDto: CreateBudgetDto, userId: string) {
    // Verify travel exists and user has access
    const travel = await this.prisma.travel.findUnique({
      where: { id: travelId },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!travel) {
      throw new NotFoundException('Travel not found');
    }

    // Check if user is member of travel group or the group creator
    const isMember = travel.group.members.some(member => member.userId === userId) ||
      travel.group.createdBy === userId;

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this travel group');
    }

    return this.prisma.$transaction(async (tx) => {
      // Upsert budget
      const budget = await tx.budget.upsert({
        where: {
          travelId: travelId
        },
        update: {
          totalBudget: createBudgetDto.totalBudget,
        },
        create: {
          travelId,
          totalBudget: createBudgetDto.totalBudget,
          createdBy: userId,
        },
      });

      // Update category budgets if provided
      if (createBudgetDto.categoryBudgets) {
        // Delete existing category budgets
        await tx.categoryBudget.deleteMany({
          where: { budgetId: budget.id },
        });

        // Create new category budgets
        const categoryBudgets = createBudgetDto.categoryBudgets.map(cb => ({
          budgetId: budget.id,
          categoryId: cb.categoryId,
          amount: cb.amount,
        }));

        await tx.categoryBudget.createMany({
          data: categoryBudgets,
        });
      }

      // Return complete budget
      const completeBudget = await tx.budget.findUnique({
        where: { id: budget.id },
        include: {
          categoryBudgets: {
            include: {
              category: true,
            },
          },
        },
      });

      return {
        id: completeBudget.id,
        travelId: completeBudget.travelId,
        totalBudget: completeBudget.totalBudget,
        categoryBudgets: completeBudget.categoryBudgets.map(cb => ({
          categoryId: cb.categoryId,
          amount: cb.amount,
        })),
        createdAt: completeBudget.createdAt,
        updatedAt: completeBudget.updatedAt,
      };
    });
  }

  // Analytics
  async getExpenseAnalytics(travelId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: { travelId },
      include: {
        category: true,
        splits: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        payer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Calculate total
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate by category
    const categoryTotals = expenses.reduce((acc, expense) => {
      const categoryId = expense.category.id;
      acc[categoryId] = (acc[categoryId] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate by payer
    const payerTotals = expenses.reduce((acc, expense) => {
      const payerId = expense.paidBy;
      acc[payerId] = (acc[payerId] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate balances (what each person owes/is owed)
    const balances = {} as Record<string, number>;

    expenses.forEach(expense => {
      // Payer paid the full amount
      balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;

      // Each person in the split owes their share
      expense.splits.forEach(split => {
        balances[split.userId] = (balances[split.userId] || 0) - split.amount;
      });
    });

    return {
      totalAmount,
      categoryTotals,
      payerTotals,
      balances,
      expenseCount: expenses.length,
    };
  }
}