import { useStore } from "@/context/StoreContext";
import FoodCard from "./FoodCard";

interface FoodDisplayProps {
  category: string;
}

const FoodDisplay = ({ category }: FoodDisplayProps) => {
  const { foodList } = useStore();

  const filteredFood = category === "All"
    ? foodList
    : foodList.filter((item) => item.category === category);

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            {category === "All" ? "Top Dishes" : category}{" "}
            <span className="text-primary">Near You</span>
          </h2>
          <p className="text-muted-foreground mt-2">
            {filteredFood.length} {filteredFood.length === 1 ? "dish" : "dishes"} available
          </p>
        </div>

        {filteredFood.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFood.map((item, index) => (
              <FoodCard key={item.id} item={item} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🍽️</p>
            <p className="text-lg text-muted-foreground">
              No dishes found in this category
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FoodDisplay;
