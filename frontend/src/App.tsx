import { FiCalendar } from "react-icons/fi";

function App() {
  return (
    <>
      <nav className="navbar">
        <h1 className="navbar-title">
          <FiCalendar className="navbar-title-icon" aria-hidden="true" />
          Scheduler
        </h1>
        <span className="navbar-divider" aria-hidden="true" />
        <div className="navbar-links">
          <button type="button" className="navbar-btn">
            Home
          </button>
          <button type="button" className="navbar-btn">
            Import
          </button>
        </div>
      </nav>
      <main className="main-content">
        <h1 className="page-title">
          Hello World
        </h1>
      </main>
    </>
  );
}

export default App;
