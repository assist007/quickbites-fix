import { useStore } from "@/context/StoreContext";
import FoodCard from "./FoodCard";

interface FoodDisplayProps {
  category: string;
}

const FoodDisplay = ({ category }: FoodDisplayProps) => {
  const { foodList, foodLoading } = useStore();

  const filteredFood =
    category === "All" ? foodList : foodList.filter((item) => item.category === category);

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            {category === "All" ? "Top Dishes" : category}{" "}
            <span className="text-primary">Near You</span>
          </h2>
          <p className="text-muted-foreground mt-2">
            {foodLoading
              ? "Loading dishes…"
              : `${filteredFood.length} ${filteredFood.length === 1 ? "dish" : "dishes"} available`}
          </p>
        </div>

        {foodLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-4/5" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFood.length > 0 ? (
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
