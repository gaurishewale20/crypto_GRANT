import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./Signup.module.css";
import { useNavigate } from "react-router";

const Signup = () => {
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});

	const { username, email, password } = formData;

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const navigate = useNavigate();
	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			axios
				.post("http://localhost:5000/auth/register", formData)
				.then((res) => {
					navigate("/login");
				})
				.catch((err) => {
					console.log(err);
				}); // Send signup data to backend API endpoint
			// console.log(res.data);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		const onLoad = () => {
			if (window.localStorage.getItem("token")) {
				navigate("/dashboard");
			}
		};

		onLoad();
	}, []);

	return (
		<div className={styles.main}>
			<div className={styles.signup_form}>
				<h2>Signup</h2>
				<form onSubmit={handleSubmit}>
					<input
						type="text"
						placeholder="Username"
						name="username"
						value={username}
						onChange={handleChange}
					/>
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
					<button type="submit">Sign Up</button>
				</form>
				<span>
					Have an account already? <a href="/login">Login here</a>
				</span>
			</div>
		</div>
	);
};

export default Signup;
