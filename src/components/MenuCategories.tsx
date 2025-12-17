import pizzaImage from "@/assets/pizza.jpg";
import bowlImage from "@/assets/bowl.jpg";
import saladImage from "@/assets/salad.jpg";
import wingsImage from "@/assets/wings.jpg";
import dessertImage from "@/assets/dessert.jpg";

const categories = [
  { name: "Pizza", image: pizzaImage, count: "24 items" },
  { name: "Healthy Bowls", image: bowlImage, count: "18 items" },
  { name: "Fresh Salads", image: saladImage, count: "15 items" },
  { name: "Crispy Wings", image: wingsImage, count: "12 items" },
  { name: "Desserts", image: dessertImage, count: "20 items" },
];

const MenuCategories = () => {
  return (
    <section id="menu" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary text-primary text-sm font-medium mb-4">
            Our Menu
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Explore Categories
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover our wide range of delicious cuisines, crafted with fresh ingredients
            and delivered hot to your door.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <div
              key={category.name}
              className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="aspect-square">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg font-display font-semibold text-primary-foreground mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-primary-foreground/70">
                  {category.count}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MenuCategories;
