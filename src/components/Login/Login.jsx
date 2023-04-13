import React, { useState } from "react";
import axios from "axios";
import styles from "./Login.module.css";
import { useNavigate } from "react-router";

const Login = () => {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	const { email, password } = formData;

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();

		axios
			.post("http://localhost:5000/auth/login", formData)
			.then((res) => {
				const token = res.data.token;
				const user = res.data.user;
				window.localStorage.setItem("token", token);
				window.localStorage.setItem("user", JSON.stringify(user));
				navigate("/dashboard");
			})
			.catch((err) => {
				console.log(err);
			}); // Send login data to backend API endpoint
		// console.log(res.data);
	};

	return (
		<div className={styles.main}>
			<div className={styles.login_form}>
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
				<span>
					Don't have an account?{" "}
					<a href="/signup">Click here to Sign up</a>
				</span>
			</div>
		</div>
	);
};

export default Login;
