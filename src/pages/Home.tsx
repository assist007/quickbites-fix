import { useState } from "react";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import MenuCategories from "@/components/MenuCategories";
import FoodDisplay from "@/components/FoodDisplay";
import AppDownload from "@/components/AppDownload";

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");

  return (
    <main>
      <Hero />
      <HowItWorks />
      <section id="menu">
        <MenuCategories
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        <FoodDisplay category={selectedCategory} />
      </section>
      <section id="about">
        <AppDownload />
      </section>
    </main>
  );
};

export default Home;
