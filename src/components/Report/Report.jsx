import React, { useState, useEffect } from "react";
import styles from "./Report.module.css";
import logo from "../../assets/logo.svg";
import axios from "axios";
import * as FileSaver from "file-saver";
import { Buffer } from "buffer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router";

const ReportPage = () => {
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
		console.log(csvFile);
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
				const dataUrl = `data:image/png;base64,${res.data}`;
				setSpendsGraph(dataUrl);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const fetchBalanceHistory = async (csvFile, accountNo) => {
		const formData = new FormData();
		formData.append("file", csvFile);
		console.log(csvFile);
		axios
			.post(
				`http://127.0.0.1:8080/get_balance_history/${accountNo}`,
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
					},
				}
			)
			.then((res) => {
				const dataUrl = `data:image/png;base64,${res.data}`;
				setBalanceGraph(dataUrl);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const [selectedFiles, setSelectedFiles] = useState([]);
	const [accountNo, setAccountNo] = useState("");
	const [incomingCount, setIncomingCount] = useState([]);
	const [outgointCount, setOutgointCount] = useState([]);
	const [transactions, setTransactions] = useState({});
	const [mean, setMean] = useState([]);
	const [balanceGraph, setBalanceGraph] = useState("");
	const [spendsGraph, setSpendsGraph] = useState("");

	const [cycleNodes, setCycleNodes] = useState([]);
	const [hubs, setHubs] = useState({});
	const [authorities, setAuthorities] = useState({});
	const [pageRanks, setPageRanks] = useState([]);

	const [user, setUser] = useState({});
	const [token, setToken] = useState("");
	const [investigation, setInvestigation] = useState({});

	function base64toFile(base64Data, filename) {
		const sliceSize = 1024;
		const byteCharacters = atob(base64Data);
		const byteArrays = [];

		for (
			let offset = 0;
			offset < byteCharacters.length;
			offset += sliceSize
		) {
			const slice = byteCharacters.slice(offset, offset + sliceSize);

			const byteNumbers = new Array(slice.length);
			for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			const byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}

		const file = new File(byteArrays, filename, { type: "text/csv" });
		return file;
	}

	const fetchInvestigation = () => {
		const id = window.location.pathname.split("/")[2];
		axios
			.get(`http://localhost:5000/investigations/${id}`, {
				headers: {
					Authorization: `Bearer ${window.localStorage.getItem("token")}`,
				},
			})
			.then((res) => {
				console.log(res.data.investigation.file);

				setInvestigation(res.data.investigation);
				const file = base64toFile(res.data.investigation.file, "input.csv");
				setSelectedFiles(file);

				fetchVolumes(file);
				fetchCycles();
				fetchHITS();
				fetchPageRank();
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const navigate = useNavigate();

	useEffect(() => {
		const onLoad = () => {
			if (!window.localStorage.getItem("token")) {
				navigate("/login");
			} else {
				setToken(window.localStorage.getItem("token"));
				setUser(JSON.parse(window.localStorage.getItem("user")));
			}
			fetchInvestigation();
		};

		onLoad();
	}, []);

	const fetchCycles = async () => {
		axios.get("http://127.0.0.1:8080/cycles").then((res) => {
			console.log(res.data);
			setCycleNodes(res.data.cycles);
		});
	};

	const fetchHITS = async () => {
		axios.get("http://127.0.0.1:8080/hits").then((res) => {
			console.log(res.data);
			setHubs(res.data.Hubs);
			setAuthorities(res.data.Authorities);
		});
	};

	const fetchPageRank = async () => {
		axios.get("http://127.0.0.1:8080/pageRank").then((res) => {
			console.log(res.data);
			setPageRanks(res.data);
		});
	};

	const changeHandler = (event) => {
		setSelectedFiles(event.target.files[0]);
	};

	const fetchData = async () => {
		fetchSpends(selectedFiles, accountNo);
		fetchBalanceHistory(selectedFiles, accountNo);
		// fetchVolumes(selectedFiles);
		// fetchCycles();
		// fetchHITS();
		// fetchPageRank();
	};

	return (
		<div className={styles.pageContainer}>
			<div className={styles.logoContainer}>
				<img src={logo} alt="" />
			</div>
			<div className={styles.workspaceContainer}>
				<div className={styles.allAccountsTxnCount}>
					{/* <input type="file" onChange={changeHandler} /> */}
					<input
						type="text"
						onChange={(e) => setAccountNo(e.target.value)}
						value={accountNo}
					/>
					<button className={styles.btn} onClick={fetchData}>
						Get Details
					</button>
					{/* Displays find Volume data */}
					<div className={styles.tables}>
						<h2>All Accounts Transaction Summary</h2>
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
				</div>
				<div className={styles.selectedUsergraphs}>
					<div className={styles.graphs}>
						<div>
							{/*Spending history*/}

							{spendsGraph && (
								<img src={spendsGraph} alt="Bar Plot" />
							)}
							{/*Balance history*/}
							{balanceGraph && (
								<img src={balanceGraph} alt="Bar Plot" />
							)}
						</div>
					</div>
				</div>

				<div className={styles.ml}>
					<div>{/* Fraud Patterns*/}</div>
					<div className={styles.cycles}>
						{/* Cycle Patterns*/}
						{cycleNodes.map((val, index) => {
							// console.log(val);
							return (
								<div>
									<h2>Cycle {index + 1}: </h2>
									<div>
										{val.nodes.map((node, i) => {
											// console.log(node);
											return (
												<p>
													{node} :{" "}
													{val.transactions[i]}
												</p>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
					<div className={styles.hits}>
						{/* HITS*/}
						<h2>
							According to HITS we got the following nodes as Hubs
							and authorities:
						</h2>
						<div>
							<h5>Hubs</h5>
							{Object.keys(hubs).map((key, i) => {
								if (hubs[key] > 0.01) {
									return (
										<p>
											{key} : {hubs[key]}
										</p>
									);
								} else {
									return null;
								}
							})}
						</div>
						<div>
							<h5>Authorities</h5>
							{Object.keys(authorities).map((key, i) => {
								if (authorities[key] >= 0.1) {
									return (
										<p>
											{key} : {authorities[key]}
										</p>
									);
								} else {
									return null;
								}
							})}
						</div>
					</div>
					<div className={styles.pageRank}>
						{/* PageRank */}
						<h2>
							According to Page rank we got the following nodes:
						</h2>

						<div>
							<h5>Page Rank</h5>
							{pageRanks.nodes &&
								pageRanks.nodes.map((val, i) => {
									console.log(pageRanks);
									if (pageRanks.scores[i] >= 0.1) {
										return (
											<p>
												{val} : {pageRanks.scores[i]}
											</p>
										);
									} else {
										return null;
									}
								})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const Report = () => {
	const handleDownloadPDF = () => {
		// Create a new jsPDF instance
		const pdf = new jsPDF();

		// Get the DOM element for the div to be downloaded
		const divElement = document.getElementById("pdf-div");

		// Convert the div element to a canvas
		html2canvas(divElement).then((canvas) => {
			// Get the data URL from the canvas
			const dataUrl = canvas.toDataURL("image/jpeg", 1.0);

			// Add the image data URL to the PDF
			pdf.addImage(
				dataUrl,
				"JPEG",
				0,
				0,
				pdf.internal.pageSize.width,
				pdf.internal.pageSize.height
			);

			// Save the PDF
			pdf.save("downloaded_pdf.pdf");
		});
	};
	return (
		<>
			<button className={styles.btn} onClick={handleDownloadPDF}>
				Download Report
			</button>

			<div id="pdf-div">
				<ReportPage />
			</div>
		</>
	);
};
export default Report;
