import Projects from "../components/Projects";

function ProjectsPage() {

  const projects = [
    {
      title: "Portfolio Website",
      description:
        "A personal portfolio built using React."
    },

    {
      title: "VoteSentinel",
      description:
        "A secure online voting platform."
    },

    {
      title: "Automated Contract Billing Console",
      description:
        "An application for creating contracts, points and automated invoice generation."
    }
  ];

  return (
    <Projects
      projects={projects}
    />
  );
}

export default ProjectsPage;