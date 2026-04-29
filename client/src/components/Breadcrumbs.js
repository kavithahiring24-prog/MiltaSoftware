import { Link, useLocation } from "react-router-dom";

function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="breadcrumbs">
      <Link to="/home">Home</Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;

        return last ? (
          <span key={to} className="breadcrumb-item active">
            <span className="breadcrumb-separator">/</span>
            {value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ")}
          </span>
        ) : (
          <span key={to} className="breadcrumb-item">
            <span className="breadcrumb-separator">/</span>
            <Link to={to}>
              {value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ")}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
