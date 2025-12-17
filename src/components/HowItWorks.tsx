import { Search, ShoppingBag, Truck, Utensils } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Browse Menu",
    description: "Explore our wide variety of delicious dishes from different cuisines.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: ShoppingBag,
    title: "Place Order",
    description: "Add your favorite items to cart and checkout securely.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Our riders will deliver your food hot and fresh to your doorstep.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Utensils,
    title: "Enjoy Food",
    description: "Sit back, relax and enjoy your delicious meal with loved ones.",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get your favorite food delivered in just 4 simple steps
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
              )}

              <div className="relative bg-card rounded-2xl p-6 text-center border border-border hover:border-primary/50 hover:shadow-large transition-all duration-300 group-hover:-translate-y-2">
                {/* Step number */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 ${step.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <step.icon className={`h-8 w-8 ${step.color}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
