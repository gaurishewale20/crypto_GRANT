import React, { useState } from "react";
import axios from "axios";
import styles from "./Login.module.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("https://127.0.0.1:5000/login", formData); // Send login data to backend API endpoint
      console.log(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.login_form} >
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={email}
            onChange={handleChange}
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={password}
            onChange={handleChange}
          />
          <button type="submit">Login</button>
        </form>
        <span>Don't have an account? <a href="/register">Click here to Sign up</a></span>
      </div>
    </div>
  );
};

export default Login;
