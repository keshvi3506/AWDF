import {
  BrowserRouter,
  Routes,
  Route,
  Link
} from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import ProjectsPage from "./pages/ProjectsPage";
import Contact from "./pages/Contact";

function App() {

  return (
    <BrowserRouter>

      {/* Header */}

      <Header
        name="Keshvi Vishal Kapadia"
        role="CYBER SECURITY ENTHUSIAST | WEB DEVELOPER"
      />


      {/* Navigation */}

      <nav className="navbar">

        <Link to="/">
          Home
        </Link>

        <Link to="/projects">
          Projects
        </Link>

        <Link to="/contact">
          Contact
        </Link>

      </nav>


      {/* Routes */}

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/projects"
          element={<ProjectsPage />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

      </Routes>


      {/* Footer */}

      <Footer
        email="keshvivishal@gmail.com"
      />

    </BrowserRouter>
  );
}

export default App;