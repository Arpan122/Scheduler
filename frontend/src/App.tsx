import { FiCalendar } from "react-icons/fi";
import { ServerHealth } from "./components/ServerHealth";

function App() {
  return (
    <>
      <nav className="navbar">
        <h1 className="navbar-title">
          <FiCalendar className="navbar-title-icon" aria-hidden="true" />
          Schedule to Calendar
        </h1>
        <span className="navbar-divider" aria-hidden="true" />
        <div className="navbar-links">
          <button type="button" className="navbar-btn active">
            Home
          </button>
          <button type="button" className="navbar-btn">
            Import
          </button>
        </div>
      </nav>
      <main className="main-content">
        <div className="hero-section">
          <h1 className="page-title">
            Schedule to Calendar AI
          </h1>
          <p className="page-subtitle">
            Upload your course or work schedules and instantly sync events directly to your Google Calendar.
          </p>
        </div>
        
        <ServerHealth />
      </main>
    </>
  );
}

export default App;

