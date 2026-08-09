import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;

const imageExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type ImageMimeType = keyof typeof imageExtensions;

export interface ProductImageUploadFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface StoredProductImage {
  filePath: string;
  url: string;
}

@Injectable()
export class ProductImageUploadService {
  constructor(private readonly configService: ConfigService) {}

  static isSupportedMimeType(mimetype: string): boolean {
    return mimetype in imageExtensions;
  }

  async store(file: ProductImageUploadFile): Promise<StoredProductImage> {
    this.validateFile(file);

    const extension = this.getValidatedExtension(file);
    const directory = join(this.getUploadRoot(), 'products');
    await mkdir(directory, { recursive: true });

    const filename = `${randomUUID()}.${extension}`;
    const filePath = join(directory, filename);
    await writeFile(filePath, file.buffer, { flag: 'wx' });

    const publicBaseUrl = this.configService
      .getOrThrow<string>('uploads.publicBaseUrl')
      .replace(/\/$/, '');

    return {
      filePath,
      url: `${publicBaseUrl}/uploads/products/${filename}`,
    };
  }

  async remove(filePath: string): Promise<void> {
    await rm(filePath, { force: true });
  }

  async removeLocalProductImage(url: string): Promise<void> {
    const publicBaseUrl = this.configService
      .getOrThrow<string>('uploads.publicBaseUrl')
      .replace(/\/$/, '');
    const localUrlPrefix = `${publicBaseUrl}/uploads/products/`;
    if (!url.startsWith(localUrlPrefix)) return;

    const filename = basename(url.slice(localUrlPrefix.length));
    if (!filename || filename !== url.slice(localUrlPrefix.length)) return;
    await this.remove(join(this.getUploadRoot(), 'products', filename));
  }

  private validateFile(file: ProductImageUploadFile): void {
    if (!file?.buffer?.length) {
      throw new BadRequestException('An image file is required');
    }

    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      throw new BadRequestException('Product image must not exceed 5 MB');
    }

    if (!ProductImageUploadService.isSupportedMimeType(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }
  }

  private getValidatedExtension(file: ProductImageUploadFile): string {
    const matchesSignature =
      (file.mimetype === 'image/jpeg' && this.isJpeg(file.buffer)) ||
      (file.mimetype === 'image/png' && this.isPng(file.buffer)) ||
      (file.mimetype === 'image/webp' && this.isWebp(file.buffer));

    if (!matchesSignature) {
      throw new BadRequestException('The uploaded file is not a valid image');
    }

    return imageExtensions[file.mimetype as ImageMimeType];
  }

  private getUploadRoot(): string {
    return resolve(
      process.cwd(),
      this.configService.getOrThrow<string>('uploads.directory'),
    );
  }

  private isJpeg(buffer: Buffer): boolean {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  private isPng(buffer: Buffer): boolean {
    return (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }

  private isWebp(buffer: Buffer): boolean {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString() === 'RIFF' &&
      buffer.subarray(8, 12).toString() === 'WEBP'
    );
  }
}
