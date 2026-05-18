import React, { createContext, useReducer, ReactNode } from 'react';
import type { Product, CartItem, Order } from '../types';
import { seedProducts } from '../data/seedProducts';

export interface CurrentUser {
  uid: string;
  name: string;
  phone: string;
}

interface AppState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  isAdminAuthenticated: boolean;
  currentUser: CurrentUser | null;
}

type ActionType =
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string } // product id
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'PLACE_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string } // product id
  | { type: 'LOGIN_ADMIN' }
  | { type: 'LOGOUT_ADMIN' };

const initialState: AppState = {
  products: [],
  cart: [],
  orders: [],
  isAdminAuthenticated: false,
  currentUser: null,
};

const getOrCreateUserId = () => {
  let uid = localStorage.getItem("kisanmart_uid");
  if (!uid) {
    uid = "guest_" + Date.now().toString(36);
    localStorage.setItem("kisanmart_uid", uid);
  }
  return uid;
};

const init = (initialStateParam: AppState): AppState => {
  const storedProducts = localStorage.getItem('km_products');
  const storedCart = localStorage.getItem('km_cart');
  const storedOrders = localStorage.getItem('km_orders');
  const storedAuth = localStorage.getItem('km_adminAuth');

  return {
    products: storedProducts ? JSON.parse(storedProducts) : seedProducts,
    cart: storedCart ? JSON.parse(storedCart) : [],
    orders: storedOrders ? JSON.parse(storedOrders) : [],
    isAdminAuthenticated: storedAuth === 'true',
    currentUser: {
      uid: getOrCreateUserId(),
      name: 'Guest User',
      phone: ''
    }
  };
};

const appReducer = (state: AppState, action: ActionType): AppState => {
  let newState: AppState;

  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItemIndex = state.cart.findIndex(
        (item) => item.product.id === action.payload.product.id
      );
      let newCart = [...state.cart];
      if (existingItemIndex >= 0) {
        newCart[existingItemIndex].quantity += action.payload.quantity;
      } else {
        newCart.push(action.payload);
      }
      newState = { ...state, cart: newCart };
      break;
    }
    case 'REMOVE_FROM_CART':
      newState = {
        ...state,
        cart: state.cart.filter((item) => item.product.id !== action.payload),
      };
      break;
    case 'UPDATE_CART_QUANTITY':
      newState = {
        ...state,
        cart: state.cart.map((item) =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
      break;
    case 'CLEAR_CART':
      newState = { ...state, cart: [] };
      break;
    case 'PLACE_ORDER':
      newState = { ...state, orders: [action.payload, ...state.orders] };
      break;
    case 'UPDATE_ORDER_STATUS':
      newState = {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        ),
      };
      break;
    case 'ADD_PRODUCT':
      newState = { ...state, products: [action.payload, ...state.products] };
      break;
    case 'UPDATE_PRODUCT':
      newState = {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
      break;
    case 'DELETE_PRODUCT':
      newState = {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
      break;
    case 'LOGIN_ADMIN':
      newState = { ...state, isAdminAuthenticated: true };
      break;
    case 'LOGOUT_ADMIN':
      newState = { ...state, isAdminAuthenticated: false };
      break;
    default:
      return state;
  }

  // Persist state to localStorage
  if (['ADD_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT'].includes(action.type)) {
    localStorage.setItem('km_products', JSON.stringify(newState.products));
  }
  if (['ADD_TO_CART', 'REMOVE_FROM_CART', 'UPDATE_CART_QUANTITY', 'CLEAR_CART'].includes(action.type)) {
    localStorage.setItem('km_cart', JSON.stringify(newState.cart));
  }
  if (['PLACE_ORDER', 'UPDATE_ORDER_STATUS'].includes(action.type)) {
    localStorage.setItem('km_orders', JSON.stringify(newState.orders));
  }
  if (['LOGIN_ADMIN', 'LOGOUT_ADMIN'].includes(action.type)) {
    localStorage.setItem('km_adminAuth', String(newState.isAdminAuthenticated));
  }

  return newState;
};

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<ActionType>;
}>({
  state: initialState,
  dispatch: () => null,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, init);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
