function Projects() {
  return (
    <section className="card">

      <h2>My Projects</h2>

      <div className="project-item">

        <h3>Portfolio Website</h3>

        <p>
          A personal portfolio built using React.
        </p>

        <a
          href="https://github.com/keshvikapadia3/portfolio"
          target="_blank"
          rel="noopener noreferrer"
          className="github-button"
        >
          GitHub Repository
        </a>

      </div>


      <div className="project-item">

        <h3>VoteSentinel</h3>

        <p>
          A secure online voting platform.
        </p>

        <a
          href="https://github.com/keshvikapadia3/VoteSentinel"
          target="_blank"
          rel="noopener noreferrer"
          className="github-button"
        >
          GitHub Repository
        </a>

      </div>


      <div className="project-item">

        <h3>Automated Contract Billing Console</h3>

        <p>
          An application for creating contracts, points and automated invoice generation.
        </p>

        <a
          href="https://github.com/keshvikapadia3/Automated-Contract-Billing-Console"
          target="_blank"
          rel="noopener noreferrer"
          className="github-button"
        >
          GitHub Repository
        </a>

      </div>

    </section>
  );
}

export default Projects;