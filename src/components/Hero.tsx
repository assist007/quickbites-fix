import { ArrowRight, Star, Clock, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-warm -z-10" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="text-lg">🔥</span>
              <span>#1 Food Delivery App</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Delicious Food,{" "}
              <span className="text-primary">Delivered Fast</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
              Order your favourite food from the best restaurants near you. 
              Fast delivery, great prices, and amazing taste!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Button 
                size="lg" 
                className="gradient-hero text-white shadow-glow hover:shadow-large transition-all"
                onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Order Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                How It Works
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-bold">4.8+</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-bold">30 min</p>
                  <p className="text-xs text-muted-foreground">Delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bike className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold">Free</p>
                  <p className="text-xs text-muted-foreground">Delivery 500+</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80"
                alt="Delicious food"
                className="w-full h-auto rounded-3xl shadow-large"
              />
              
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-large animate-bounce-gentle">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=80"
                    alt="Burger"
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-semibold text-sm">Chicken Burger</p>
                    <p className="text-primary font-bold">৳280</p>
                  </div>
                </div>
              </div>

              {/* Rating badge */}
              <div className="absolute -top-4 -right-4 bg-card px-4 py-2 rounded-full shadow-large flex items-center gap-2">
                <Star className="h-4 w-4 text-warning fill-warning" />
                <span className="font-bold text-sm">4.9</span>
                <span className="text-xs text-muted-foreground">(2k+)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
