import React, { useState, useEffect } from "react";
import styles from "./Report.module.css";
import logo from "../../assets/logo.svg";
import axios from "axios";
import * as FileSaver from "file-saver";

const Report = () => {
	const fetchVolumes = async (csvFile) => {
		const formData = new FormData();
		formData.append("file", csvFile);
		axios
			.post("http://127.0.0.1:8080/findVolumes", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			})
			.then((res) => {
				setIncomingCount(res.data[0][1]);
				setOutgointCount(res.data[1][1]);
				setTransactions(res.data[2][1]);
				setMean(res.data[3][1]);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const fetchSpends = async (csvFile, accountNo) => {
		const formData = new FormData();
		formData.append("file", csvFile);

		axios
			.post(
				`http://127.0.0.1:8080/get_spend_analyser/${accountNo}`,
				formData,
				{
					headers: { "Content-Type": "multipart/form-data" },
				}
			)
			.then((res) => {
				console.log(res.data);
				const url = window.URL.createObjectURL(new Blob([res.data]));
				setSpendsGraph(url);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const fetchBalanceHistory = async (csvFile, accountNo) => {
		const formData = new FormData();
		formData.append("file", csvFile);
		axios
			.post(
				`http://127.0.0.1:8080/get_balance_history/${accountNo}`,
				formData
			)
			.then((res) => {
				const url = window.URL.createObjectURL(new Blob([res.data]));
				setBalanceGraph(url);
				const file = new Blob([res.data], { type: "image/png" });
				FileSaver.saveAs(file, "image.png");
				console.log(url);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const [selectedFiles, setSelectedFiles] = useState([]);
	const [accountNo, setAccountNo] = useState("");

	const changeHandler = (event) => {
		setSelectedFiles(event.target.files[0]);
	};

	const fetchData = async () => {
		fetchSpends(selectedFiles, accountNo);
		fetchBalanceHistory(selectedFiles, accountNo);
		fetchVolumes(selectedFiles);
	};

	const [incomingCount, setIncomingCount] = useState([]);
	const [outgointCount, setOutgointCount] = useState([]);
	const [transactions, setTransactions] = useState([]);
	const [mean, setMean] = useState([]);
	const [balanceGraph, setBalanceGraph] = useState("");
	const [spendsGraph, setSpendsGraph] = useState("");
	// const [incomingCount, setIncomingCount] = useState([])

	return (
		<div className={styles.pageContainer}>
			<div>
				<div>Ankit</div>
				<input type="file" onChange={changeHandler} />
				<button onClick={fetchData}>Fetch Data</button>
			</div>
			<div className={styles.logoContainer}>
				<img src={logo} alt="" />
			</div>
			<div className={styles.workspaceContainer}>
				<div className={styles.allAccountsTxnCount}>
					<div>{/*  All Accounts*/}</div>
					{/* Displays find Volume data */}
					<table>
						<thead>
							<tr>
								<td>Account No</td>
								<td>Incoming Count</td>
								<td>Outgoing Count</td>
								<td>Total Transactions(to and from)</td>
								<td>Mean</td>
							</tr>
						</thead>
						<tbody>
							{Object.keys(transactions).map((key, i) => {
								// console.log(key);
								return (
									<tr key={key}>
										<td>{key}</td>
										<td>
											{incomingCount[key]
												? incomingCount[key]
												: 0}
										</td>
										<td>
											{outgointCount[key]
												? outgointCount[key]
												: 0}
										</td>
										<td>{transactions[key]}</td>
										<td>{mean[key] ? mean[key] : 0}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
				<div className={styles.selectedUsergraphs}>
					<input
						type="text"
						onChange={(e) => setAccountNo(e.target.value)}
						value={accountNo}
					/>
					<div>
						{/*Balance history*/}
						<img
							src="blob:http://localhost:3000/4fc8ba3d-ff0d-40db-ace4-0be5f52b4524"
							alt="Balance"
						/>
					</div>
					<div>{/*Spending history*/}</div>
				</div>
				<div className={styles.ml}>
					<div>{/* Fraud Patterns*/}</div>
					<div>{/* HITS*/}</div>
					<div>{/* PageRank */}</div>
				</div>
			</div>
		</div>
	);
};

export default Report;
