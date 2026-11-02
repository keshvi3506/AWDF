import { useState } from "react";

function Contact() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {

    event.preventDefault();

    alert(
      `Thank you ${name}! Your message has been submitted.`
    );

    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <section>

      <h2>Contact Me</h2>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          required
        />

        <br />
        <br />

        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
        />

        <br />
        <br />

        <textarea
          placeholder="Your Message"
          rows="5"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          required
        />

        <br />
        <br />

        <button type="submit">
          Send Message
        </button>

      </form>

    </section>
  );

  
}



export default Contact;