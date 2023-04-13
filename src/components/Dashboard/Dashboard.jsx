import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import styles from "./Dashboard.module.css";
import logo from "../../assets/logo.svg";

const Dashboard = () => {
	const navigate = useNavigate();

	const [user, setUser] = useState({});
	const [token, setToken] = useState("");

	const [investigations, setInvestigations] = useState([]);

	const fetchAllInvestigations = async () => {
		axios
			.get("http://localhost:5000/investigations/", {
				headers: {
					Authorization: `Bearer ${token}`,
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

	const signout = (e) => {
		e.preventDefault();
		window.localStorage.clear();
		//  function for sign out
	};

	const goToUploadPage = () => {
		navigate("/");
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
		<div className={styles.pageContainer}>
			<div className={styles.logoContainer}>
				<img src={logo} alt="" />
			</div>
			<div className={styles.toolbarContainer}>
				<button
					className={styles.genReportTool}
					onClick={goToUploadPage}
				>
					New Case
				</button>
				<button className={styles.genReportTool} onClick={signout}>
					Sign Out
				</button>
			</div>
			<div className={styles.workspaceContainer}>
				<span className={styles.sectionHeader}>Dashboard</span>
				<div className={styles.investigation}>
					{investigations &&
						investigations.map((val, index) => {
							return (
								<div className={styles.card}>
									<button
										className={styles.btn}
										onClick={(e) => {
											e.preventDefault();
											navigate(`/visualize/${val._id}`);
										}}
									>
										{val.name}
									</button>
								</div>
							);
						})}
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
