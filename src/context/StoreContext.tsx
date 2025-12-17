import { createContext, useContext, useState, ReactNode } from "react";

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
}

interface CartItem {
  [key: string]: number;
}

interface StoreContextType {
  foodList: FoodItem[];
  cartItems: CartItem;
  addToCart: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  getTotalCartAmount: () => number;
  getTotalCartItems: () => number;
  clearCart: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

// Menu categories with icons
export const menuCategories = [
  { name: "All", icon: "🍽️" },
  { name: "Pizza", icon: "🍕" },
  { name: "Burgers", icon: "🍔" },
  { name: "Noodles", icon: "🍜" },
  { name: "Salads", icon: "🥗" },
  { name: "Rice", icon: "🍚" },
  { name: "Japanese", icon: "🍣" },
  { name: "Desserts", icon: "🍰" },
  { name: "Drinks", icon: "🥤" },
  { name: "Wraps", icon: "🌯" },
];

// Mock food data
const mockFoodList: FoodItem[] = [
  {
    id: "1",
    name: "Margherita Pizza",
    description: "Fresh tomatoes, mozzarella, basil on a crispy crust",
    price: 450,
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&q=80",
    category: "Pizza",
    rating: 4.8,
  },
  {
    id: "2",
    name: "Chicken Burger",
    description: "Juicy grilled chicken with lettuce, tomato & special sauce",
    price: 280,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    category: "Burgers",
    rating: 4.6,
  },
  {
    id: "3",
    name: "Pad Thai",
    description: "Classic Thai stir-fried noodles with shrimp & peanuts",
    price: 350,
    image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80",
    category: "Noodles",
    rating: 4.7,
  },
  {
    id: "4",
    name: "Caesar Salad",
    description: "Crisp romaine, parmesan, croutons with caesar dressing",
    price: 220,
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80",
    category: "Salads",
    rating: 4.5,
  },
  {
    id: "5",
    name: "Beef Biryani",
    description: "Aromatic basmati rice with tender beef & exotic spices",
    price: 380,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
    category: "Rice",
    rating: 4.9,
  },
  {
    id: "6",
    name: "Sushi Platter",
    description: "Assorted fresh sushi rolls with wasabi & ginger",
    price: 650,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80",
    category: "Japanese",
    rating: 4.8,
  },
  {
    id: "7",
    name: "Chocolate Cake",
    description: "Rich dark chocolate layers with ganache frosting",
    price: 180,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
    category: "Desserts",
    rating: 4.9,
  },
  {
    id: "8",
    name: "Mango Smoothie",
    description: "Fresh tropical mangoes blended with yogurt",
    price: 120,
    image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80",
    category: "Drinks",
    rating: 4.6,
  },
  {
    id: "9",
    name: "Pepperoni Pizza",
    description: "Classic pepperoni with mozzarella & tomato sauce",
    price: 520,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80",
    category: "Pizza",
    rating: 4.7,
  },
  {
    id: "10",
    name: "Veggie Wrap",
    description: "Grilled vegetables with hummus in a tortilla wrap",
    price: 200,
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80",
    category: "Wraps",
    rating: 4.4,
  },
  {
    id: "11",
    name: "Fried Rice",
    description: "Wok-tossed rice with vegetables, egg & soy sauce",
    price: 250,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80",
    category: "Rice",
    rating: 4.5,
  },
  {
    id: "12",
    name: "Ice Cream Sundae",
    description: "Three scoops with chocolate, caramel & whipped cream",
    price: 150,
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80",
    category: "Desserts",
    rating: 4.7,
  },
];

export const StoreContextProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem>({});

  const addToCart = (itemId: string) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId] -= 1;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalCartAmount = () => {
    let total = 0;
    for (const itemId in cartItems) {
      const item = mockFoodList.find((food) => food.id === itemId);
      if (item) {
        total += item.price * cartItems[itemId];
      }
    }
    return total;
  };

  const getTotalCartItems = () => {
    let total = 0;
    for (const itemId in cartItems) {
      total += cartItems[itemId];
    }
    return total;
  };

  const clearCart = () => {
    setCartItems({});
  };

  const value: StoreContextType = {
    foodList: mockFoodList,
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    getTotalCartItems,
    clearCart,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreContextProvider");
  }
  return context;
};
