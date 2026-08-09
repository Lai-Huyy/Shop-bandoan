export interface DirectCheckoutItem {
  productId: string;
  quantity: number;
  selectedOptions?: string[];
}

export interface CheckoutInput {
  addressId: string;
  cartItemIds?: string[];
  directItem?: DirectCheckoutItem;
  couponClaimId?: string;
  couponCode?: string;
}

export interface CheckoutResult {
  id: string;
  orderNumber: string;
}

export interface UserAddress {
  id: string;
  label: string | null;
  recipientName: string;
  recipientPhone: string;
  streetAddress: string;
  provinceCode: string | null;
  provinceName: string | null;
  wardCode: string | null;
  wardName: string | null;
  ward: string | null;
  district: string | null;
  city: string;
  note: string | null;
  isDefault: boolean;
}

export interface AddressInput {
  label?: string;
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  streetAddress: string;
  note?: string;
  isDefault?: boolean;
}
