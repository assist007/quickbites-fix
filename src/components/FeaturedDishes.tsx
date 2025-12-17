import { Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import pizzaImage from "@/assets/pizza.jpg";
import bowlImage from "@/assets/bowl.jpg";
import saladImage from "@/assets/salad.jpg";
import wingsImage from "@/assets/wings.jpg";

const dishes = [
  {
    name: "Margherita Pizza",
    description: "Fresh mozzarella, tomatoes, basil",
    price: 14.99,
    rating: 4.9,
    image: pizzaImage,
    tag: "Best Seller",
  },
  {
    name: "Salmon Poke Bowl",
    description: "Fresh salmon, avocado, edamame",
    price: 16.99,
    rating: 4.8,
    image: bowlImage,
    tag: "Healthy",
  },
  {
    name: "Greek Salad",
    description: "Feta, olives, cucumber, tomatoes",
    price: 12.99,
    rating: 4.7,
    image: saladImage,
    tag: "Fresh",
  },
  {
    name: "Crispy Chicken",
    description: "Golden fried with special sauce",
    price: 13.99,
    rating: 4.9,
    image: wingsImage,
    tag: "Popular",
  },
];

const FeaturedDishes = () => {
  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 md:mb-16">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary text-primary text-sm font-medium mb-4">
              Featured
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
              Popular Dishes
            </h2>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0">
            View All Menu
          </Button>
        </div>

        {/* Dishes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dishes.map((dish, index) => (
            <div
              key={dish.name}
              className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {dish.tag}
                </span>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {dish.rating}
                  </span>
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-1">
                  {dish.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {dish.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">
                    ${dish.price}
                  </span>
                  <Button size="icon" className="rounded-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDishes;
