import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

const MainLayout = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
