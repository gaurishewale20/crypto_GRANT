import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
	const navigate = useNavigate();

	const [user, setUser] = useState({});
	const [token, setToken] = useState("");

	const [investigations, setInvestigations] = useState([]);

	const fetchAllInvestigations = async () => {
		axios
			.get("http://localhost:5000/investigations/", {
				headers: {
					Authorization:
						"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NDM3MzY4MjQ4M2ZiNDcxZWJlMzQyMmQiLCJpYXQiOjE2ODEzNDAwNDIsImV4cCI6MTY4MTk0NDg0Mn0.cd81aLVoNLI4pvIZUHZwvgtNMTXd2h3wLkEzPR_EuTA",
				},
			})
			.then((res) => {
				console.log(res.data.investigations);
				setInvestigations(res.data.investigations);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	useEffect(() => {
		const onLoad = () => {
			if (!window.localStorage.getItem("token")) {
				// navigate("/login");
			} else {
				setToken(window.localStorage.getItem("token"));
				setUser(JSON.parse(window.localStorage.getItem("user")));
			}
			fetchAllInvestigations();
		};

		onLoad();
	}, []);
	return (
		<div className={styles.main}>
			Dashboard
			<div className={styles.pageContainer}>
				{investigations.map((val, index) => {
					return (
						<div>
							<p style={{ color: "#000" }}>{val.name}</p>
							<button
								onClick={(e) => {
									e.preventDefault();
									navigate(`/visualize/${val._id}`);
								}}
							>
								Open Investigation
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default Dashboard;
