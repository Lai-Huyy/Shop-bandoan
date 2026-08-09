import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Category } from '../../../generated/prisma';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FindCategoriesQueryDto } from './dto/find-categories-query.dto';
import { PaginatedCategoriesResponseDto } from './dto/category-response.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    await this.ensureParentExists(dto.parentId);
    try {
      return await this.categoriesRepository.create({
        ...dto,
        isDisplayed: dto.isDisplayed ?? true,
        sortOrder: dto.sortOrder ?? 0,
      });
    } catch (error: unknown) {
      this.throwIfDuplicateSlug(error);
      throw error;
    }
  }

  async findAll(
    query: FindCategoriesQueryDto,
    includeHidden = false,
  ): Promise<PaginatedCategoriesResponseDto> {
    const { categories, totalItems } = await this.categoriesRepository.findAll({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      search: query.search,
      includeHidden,
    });
    return {
      items: categories,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  }

  async findOne(id: number, includeHidden = false): Promise<Category> {
    const category = await this.categoriesRepository.findById(
      id,
      includeHidden,
    );
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id, true);
    if (dto.parentId === id)
      throw new ConflictException('A category cannot be its own parent');
    await this.ensureParentExists(dto.parentId);
    try {
      return await this.categoriesRepository.update(id, dto);
    } catch (error: unknown) {
      this.throwIfDuplicateSlug(error);
      throw error;
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const count = await this.categoriesRepository.hide(id);
    if (count !== 1)
      throw new NotFoundException('Category not found or already hidden');
    return { message: 'Category successfully hidden' };
  }

  private async ensureParentExists(
    parentId: number | undefined,
  ): Promise<void> {
    if (parentId) await this.findOne(parentId, true);
  }
  private throwIfDuplicateSlug(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictException('Category slug already exists');
  }
}
