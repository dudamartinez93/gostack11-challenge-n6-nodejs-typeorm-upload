// import AppError from '../errors/AppError';

import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CheckAndCreateCategoryService from './CheckAndCreateCategoryService';

interface ServiceRequest {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: ServiceRequest): Promise<Transaction> {
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Invalid type for transaction');
    }
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('You cannot make this transition. Insufficient cash!');
    }

    const checkAndCreateCategoryService = new CheckAndCreateCategoryService();

    const transactionCategory = await checkAndCreateCategoryService.execute({
      title: category,
    });

    const newTransaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionsRepository.save(newTransaction);

    return newTransaction;
  }

  public async executeMany(items: ServiceRequest[]): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    items.forEach(transaction => {
      if (transaction.type !== 'income' && transaction.type !== 'outcome') {
        throw new AppError('Invalid type for transaction');
      }
    });

    const balance = await transactionsRepository.getBalance();

    const { income, outcome } = items.reduce(
      (accumulator, transaction) => {
        accumulator[transaction.type] += Number(transaction.value);
        return accumulator;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    const totalTranscationsToAdd = income - outcome;

    if (totalTranscationsToAdd + balance.total < 0) {
      throw new AppError(
        'You cannot make this transitions. Insufficient cash!',
      );
    }

    const checkAndCreateCategoryService = new CheckAndCreateCategoryService();

    const transactionsCategories = await checkAndCreateCategoryService.executeMany(
      items.map(pseudoTransactions => pseudoTransactions.category),
    );

    const newTransactions = transactionsRepository.create(
      items.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: transactionsCategories.find(
          category => category.title === transaction.title,
        ),
      })),
    );

    await transactionsRepository.save(newTransactions);

    return newTransactions;
  }
}

export default CreateTransactionService;
