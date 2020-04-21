import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface ServiceRequest {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: ServiceRequest): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactionToDelete = await transactionsRepository.findOne({
      where: { id },
    });

    if (transactionToDelete) {
      await transactionsRepository.delete(id);
    } else {
      throw new AppError('Transaction id not found', 400);
    }
  }
}

export default DeleteTransactionService;
