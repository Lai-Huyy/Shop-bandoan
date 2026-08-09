import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ProductImageUploadService } from './product-image-upload.service';

const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('ProductImageUploadService', () => {
  let directory: string;
  let service: ProductImageUploadService;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'shop-bandoan-product-images-'));
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'uploads.directory') return directory;
        if (key === 'uploads.publicBaseUrl') return 'http://localhost:3000';
        throw new Error(`Unexpected configuration key: ${key}`);
      }),
    };
    service = new ProductImageUploadService(
      configService as unknown as ConfigService,
    );
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('stores a verified image using an opaque filename and public URL', async () => {
    const stored = await service.store({
      buffer: validPng,
      mimetype: 'image/png',
      size: validPng.length,
    });

    await expect(readFile(stored.filePath)).resolves.toEqual(validPng);
    expect(stored.url).toMatch(
      /^http:\/\/localhost:3000\/uploads\/products\/[0-9a-f-]+\.png$/,
    );
  });

  it('rejects a file whose content does not match its claimed image type', async () => {
    await expect(
      service.store({
        buffer: Buffer.from('not an image'),
        mimetype: 'image/png',
        size: 12,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
