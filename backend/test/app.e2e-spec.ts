import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            success: true,
            statusCode: 200,
            data: 'Hello World!',
          }),
        );
      });
  });

  it('/users/me (GET) rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('/categories (POST) rejects unauthenticated requests', () => {
    return request(app.getHttpServer())
      .post('/categories')
      .send({ name: 'Main dishes', slug: 'main-dishes' })
      .expect(401);
  });

  it('/products (POST) rejects unauthenticated requests', () => {
    return request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Spicy beef noodle',
        slug: 'spicy-beef-noodle',
        basePrice: '79000.00',
        categoryId: 1,
      })
      .expect(401);
  });

  it('/cart (GET) rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/cart').expect(401);
  });

  it('/coupons/available (GET) rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/coupons/available').expect(401);
  });

  it('/coupons/:id/claim (POST) rejects unauthenticated requests', () => {
    return request(app.getHttpServer())
      .post('/coupons/a7e277bd-0e42-4544-a4f8-20e37b1d1b1b/claim')
      .expect(401);
  });

  it('/checkout (POST) rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).post('/checkout').send({}).expect(401);
  });

  it('/orders (GET) rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/orders').expect(401);
  });

  it('/admin/orders (GET) rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/admin/orders').expect(401);
  });

  it('/admin/users (GET) rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/admin/users').expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
