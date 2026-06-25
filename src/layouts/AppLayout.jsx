import { Outlet } from "react-router-dom";
import Sidebar from "../Components/Sidebar/Sidebar";
import "./AppLayout.css";

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
