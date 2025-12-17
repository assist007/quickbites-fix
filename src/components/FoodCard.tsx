import { Star, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, FoodItem } from "@/context/StoreContext";

interface FoodCardProps {
  item: FoodItem;
  index: number;
}

const FoodCard = ({ item, index }: FoodCardProps) => {
  const { cartItems, addToCart, removeFromCart } = useStore();
  const itemCount = cartItems[item.id] || 0;

  return (
    <div
      className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 shadow-soft hover:shadow-large transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm text-xs font-medium">
            {item.category}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-card/90 backdrop-blur-sm">
          <Star className="h-3 w-3 text-warning fill-warning" />
          <span className="text-xs font-medium">{item.rating}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">৳{item.price}</span>

          {itemCount === 0 ? (
            <Button
              size="sm"
              className="gradient-hero text-white"
              onClick={() => addToCart(item.id)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => removeFromCart(item.id)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{itemCount}</span>
              <Button
                size="icon"
                className="h-8 w-8 gradient-hero text-white"
                onClick={() => addToCart(item.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
