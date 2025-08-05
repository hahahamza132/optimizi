export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cin: string;
  imageUrl?: string;
  status: 'Active' | 'Inactive';
  role: 'client' | 'admin' | 'fournisseur';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  title: string;
  FournisseurId: string;
  imgSrc: string;
  subtitle: string;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  title: string;
  prixHTVA: number;
  tva: number;
  Tags: string[];
  prixTTC: number;
  categoryId: string;
  FournisseurId: string;
  fournisseurName?: string;
  imageURL: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  stockQuantity: number;
  discount: number;
  unit: string;
  review: Review[];
  rating?: number;
  feature: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Fournisseur {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  image: string;
  matriculeFiscale: string;
  openingHours: string;
  useUserAddress: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  promoDiscount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  deliveryAddress: DeliveryAddress;
  promoCode?: string;
  orderNotes?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  deliveredAt?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  instructions?: string;
}