import Header from "@/components/Header";
import SearchSection from "@/components/SearchSection";
import BuilderProjects from "@/components/BuilderProjects";
import FeaturedProperties from "@/components/FeaturedProperties";
import StatsSection from "@/components/StatsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SearchSection />
      <BuilderProjects />
      <FeaturedProperties />
      <StatsSection />
      <Footer />
    </div>
  );
};

export default Index;