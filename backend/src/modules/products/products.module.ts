import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { ProductImageUploadService } from './product-image-upload.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsRepository, ProductsService, ProductImageUploadService],
})
export class ProductsModule {}
