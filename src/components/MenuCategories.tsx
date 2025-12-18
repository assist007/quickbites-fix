import { useMemo } from "react";
import { useStore, categoryIconMap } from "@/context/StoreContext";

interface MenuCategoriesProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

type CategoryItem = {
  value: string;
  label: string;
  icon: string;
};

const MenuCategories = ({ selectedCategory, setSelectedCategory }: MenuCategoriesProps) => {
  const { foodList } = useStore();

  const categories = useMemo<CategoryItem[]>(() => {
    const unique = Array.from(
      new Set(foodList.map((f) => f.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return [
      { value: "All", label: "All", icon: "🍽️" },
      ...unique.map((cat) => ({
        value: cat,
        label: cat,
        icon: categoryIconMap[cat.toLowerCase()] ?? "🍴",
      })),
    ];
  }, [foodList]);

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Explore Our <span className="text-primary">Menu</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Choose from a diverse menu featuring a delectable array of dishes
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {categories.map((category, index) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`group flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl transition-all duration-300 animate-fade-in ${
                selectedCategory === category.value
                  ? "bg-primary text-primary-foreground shadow-medium scale-105"
                  : "bg-card hover:bg-accent border border-border hover:border-primary/30 shadow-soft hover:shadow-medium"
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform duration-300">
                {category.icon}
              </span>
              <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                {category.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MenuCategories;
