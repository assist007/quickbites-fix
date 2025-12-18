import { Button } from "@/components/ui/button";
import { Apple, Play } from "lucide-react";

const AppDownload = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="relative bg-gradient-to-r from-primary to-primary/80 rounded-3xl overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative grid md:grid-cols-2 gap-8 items-center p-8 md:p-12 lg:p-16">
            {/* Content */}
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Get the QuickBite App
              </h2>
              <p className="text-white/80 mb-8 max-w-md">
                For a seamless ordering experience, download our mobile app. 
                Track your orders in real-time and get exclusive offers!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Apple className="h-5 w-5 mr-2" />
                  App Store
                </Button>
                <Button
                  size="lg"
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Google Play
                </Button>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center">
              <div className="relative w-48 md:w-64">
                <div className="bg-foreground rounded-[2.5rem] p-2 shadow-2xl">
                  <div className="bg-background rounded-[2rem] overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80"
                      alt="App screenshot"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 bg-card px-4 py-2 rounded-full shadow-large flex items-center gap-2">
                  <span className="text-2xl">🍕</span>
                  <span className="font-bold text-sm">50% OFF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownload;
