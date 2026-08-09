import { UsersService } from './users.service';

describe('UsersService', () => {
  it('returns a safe current-user DTO without persistence internals', () => {
    const service = new UsersService();

    expect(
      service.getCurrentUser({
        id: 'user-id',
        username: 'customer',
        email: 'customer@example.com',
        fullName: 'Customer Example',
        role: 'CUSTOMER',
      }),
    ).toEqual({
      id: 'user-id',
      username: 'customer',
      email: 'customer@example.com',
      fullName: 'Customer Example',
      role: 'CUSTOMER',
    });
  });
});
