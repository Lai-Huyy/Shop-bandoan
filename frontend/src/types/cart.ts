export interface CartItem {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  selectedOptions: string[] | null;
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    stockQuantity: number;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: string;
  itemCount: number;
}

export interface AddCartItemInput {
  productId: string;
  quantity: number;
  selectedOptions?: string[];
}
