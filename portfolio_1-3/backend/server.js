const express = require("express");

const app = express();

const PORT = 5000;

// Middleware
app.use(express.json());
// ==============================
// LOGGING MIDDLEWARE
// ==============================
app.use((req, res, next) => {
    console.log(
        `${req.method} ${req.url} - ${new Date().toISOString()}`
    );

    next();
});


// ==============================
// HOME ROUTE
// ==============================

app.get("/", (req, res) => {
  res.send("Portfolio Backend is Running!");
});


// ==============================
// ABOUT ROUTE
// ==============================

app.get("/api/about", (req, res) => {
  res.json({
    name: "Keshvi Vishal Kapadia",
    role: "CYBER SECURITY ENTHUSIAST | WEB DEVELOPER",
    description:
      "I am a B.Tech student interested in web development and Cyber Security."
  });
});


// ==============================
// SKILLS ROUTE
// ==============================

app.get("/api/skills", (req, res) => {
  res.json([
    "React",
    "JavaScript",
    "Node.js",
    "Express.js",
    "MongoDB",
    "Git",
    "GitHub"
  ]);
});


// ==============================
// PROJECTS ROUTE
// ==============================

app.get("/api/projects", (req, res) => {
  res.json([
    {
      title: "Portfolio Website",
      description: "A personal portfolio built using React."
    },
    {
      title: "VoteSentinel",
      description: "A secure online voting platform."
    },
    {
      title: "Automated Contract Billing Console",
      description:
        "An application for creating contracts, points and automated invoice generation."
    }
  ]);
});


// ==============================
// CONTACT ROUTE
// ==============================

app.post("/api/contact", (req, res) => {

  const { name, email, message } = req.body;

  console.log("New Contact Message");
  console.log("Name:", name);
  console.log("Email:", email);
  console.log("Message:", message);

  res.json({
    success: true,
    message: "Thank you! Your message has been received."
  });

});

// ==============================
// 404 HANDLER
// ==============================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// ==============================
// GLOBAL ERROR HANDLER
// ==============================
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        success: false,
        message: "Something went wrong"
    });
});

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


