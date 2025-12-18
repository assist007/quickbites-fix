import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";

import pizzaImg from "@/assets/pizza.jpg";
import saladImg from "@/assets/salad.jpg";
import wingsImg from "@/assets/wings.jpg";
import dessertImg from "@/assets/dessert.jpg";
import bowlImg from "@/assets/bowl.jpg";

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
  foodLoading: boolean;
  refreshFoodList: () => Promise<void>;

  cartItems: CartItem;
  addToCart: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  getTotalCartAmount: () => number;
  getTotalCartItems: () => number;
  clearCart: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const categoryIconMap: Record<string, string> = {
  pizza: "🍕",
  burgers: "🍔",
  noodle: "🍜",
  noodles: "🍜",
  salad: "🥗",
  salads: "🥗",
  rice: "🍚",
  japanese: "🍣",
  dessert: "🍰",
  desserts: "🍰",
  drink: "🥤",
  drinks: "🥤",
  wrap: "🌯",
  wraps: "🌯",
  appetizer: "🥟",
  main: "🍛",
  beverage: "🥤",
  other: "🍽️",
};

const formatCategory = (raw?: string | null) => {
  const value = (raw ?? "other").toString().trim();
  if (!value) return "Other";
  const spaced = value.replace(/[_-]+/g, " ");
  return spaced
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const resolveProductImage = (imageUrl: string | null, categoryLabel: string) => {
  const url = imageUrl?.trim();
  if (url) return url;

  const key = categoryLabel.toLowerCase();
  if (key.includes("pizza")) return pizzaImg;
  if (key.includes("salad")) return saladImg;
  if (key.includes("wing")) return wingsImg;
  if (key.includes("dessert") || key.includes("cake") || key.includes("sweet")) return dessertImg;

  // nice neutral fallback
  return bowlImg;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
};

export const StoreContextProvider = ({ children }: { children: ReactNode }) => {
  const [foodList, setFoodList] = useState<FoodItem[]>([]);
  const [foodLoading, setFoodLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem>({});

  const fetchFoodList = useCallback(async () => {
    setFoodLoading(true);

    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, category, image_url")
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = ((data || []) as ProductRow[]).map((p) => {
        const categoryLabel = formatCategory(p.category);
        return {
          id: p.id,
          name: p.name,
          description: p.description ?? "",
          price: Number(p.price ?? 0),
          category: categoryLabel,
          image: resolveProductImage(p.image_url, categoryLabel),
          rating: 4.7,
        } satisfies FoodItem;
      });

      setFoodList(mapped);
    } catch (error) {
      console.error("Error loading products:", error);
      setFoodList([]);
    } finally {
      setFoodLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoodList();
  }, [fetchFoodList]);

  // local in-app event: admin adds/updates/deletes product → refresh menu + hero instantly
  useEffect(() => {
    const handler = () => {
      fetchFoodList();
    };

    window.addEventListener("qb:products-changed", handler);
    return () => window.removeEventListener("qb:products-changed", handler);
  }, [fetchFoodList]);

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
      const item = foodList.find((food) => food.id === itemId);
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

  const value = useMemo<StoreContextType>(
    () => ({
      foodList,
      foodLoading,
      refreshFoodList: fetchFoodList,
      cartItems,
      addToCart,
      removeFromCart,
      getTotalCartAmount,
      getTotalCartItems,
      clearCart,
    }),
    [foodList, foodLoading, fetchFoodList, cartItems]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreContextProvider");
  }
  return context;
};

