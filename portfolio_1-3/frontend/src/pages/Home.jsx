import About from "../components/About";
import Skills from "../components/Skills";

function Home() {

  const skills = [
    "React",
    "JavaScript",
    "Node.js",
    "Express.js",
    "MongoDB",
    "Git",
    "GitHub"
  ];

  return (
    <>
      <About
        description="I am a B.Tech student interested in web development and Cyber Security."
      />

      <Skills
        skills={skills}
      />
    </>
  );
}

export default Home;