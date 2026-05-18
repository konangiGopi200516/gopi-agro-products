export interface Product {
  id: string;
  name: string;
  category: 'Vegetables' | 'Fruits' | 'Grains' | 'Dairy';
  price: number;
  unit: 'kg' | 'litre' | 'dozen' | 'piece';
  stock: number;
  farmerName: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  buyerName: string;
  phone: string;
  address: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'COD' | 'PhonePe' | 'GooglePay' | 'Paytm';
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  createdAt: string;
}
