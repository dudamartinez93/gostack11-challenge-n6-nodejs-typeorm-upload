/* eslint-disable consistent-return */
/* eslint-disable no-useless-return */
import { getRepository, In } from 'typeorm';
// import AppError from '../errors/AppError';

import Category from '../models/Category';

interface ServiceRequest {
  title: string;
}

class CheckAndCreateCategoryService {
  public async execute({ title }: ServiceRequest): Promise<Category> {
    const categoriesRepository = getRepository(Category);

    const checkedCategory = await categoriesRepository.findOne({
      where: { title },
    });

    if (!checkedCategory) {
      const newCategory = categoriesRepository.create({
        title,
      });
      await categoriesRepository.save(newCategory);
      return newCategory;
    }
    return checkedCategory;
  }

  public async executeMany(categoriesTitle: string[]): Promise<Category[]> {
    const categoriesRepository = getRepository(Category);

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categoriesTitle),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    // Essa lógica é um pouco complicada. Ela pega os valores de
    // 'categoriesTitle' que NÃO estão inclusas no 'existentCategoriesTitles'.
    // depois são filtrados os valores duplicados.
    const newCategoriesTitles = categoriesTitle
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      newCategoriesTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const handledCategories = [...existentCategories, ...newCategories];

    return handledCategories;
  }
}

export default CheckAndCreateCategoryService;
