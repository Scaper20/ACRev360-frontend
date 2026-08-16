import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { NAV_SECTIONS } from "./navSections";

export function Sidebar() {
  const { user } = useAuth();
  const sections = (user && NAV_SECTIONS[user.access_level]) || [];

  return (
    <nav className="sidebar">
      <div className="sidebar-brand display">ACRev360</div>
      {sections.map((section) => (
        <div className="nav-section" key={section.section}>
          <div className="nav-section-label">{section.section}</div>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
