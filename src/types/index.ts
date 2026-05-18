export interface Product {
  id: string;
  name: string;
  category: any;
  price: number;
  unit: string;
  stock: number;
  farmerName: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  [key: string]: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  orderId?: string;
  userId?: string;
  uid?: string;
  buyerName?: string;
  userName?: string;
  phone?: string;
  userPhone?: string;
  userEmail?: string;
  address?: string;
  deliveryAddress?: string;
  items: CartItem[];
  total: number;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  upiTransactionId?: string;
  status: string;
  createdAt: string;
  [key: string]: any;
}
