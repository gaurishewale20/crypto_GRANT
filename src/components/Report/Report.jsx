import React, { useState, useEffect } from "react";
import styles from "./Report.module.css";
import logo from "../../assets/logo.svg";
import axios from "axios";
import * as FileSaver from "file-saver";
import { Buffer } from "buffer";
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
    console.log(csvFile);
    formData.append("file", csvFile);

    axios
      .post(`http://127.0.0.1:8080/get_spend_analyser/${accountNo}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
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

	const fetchCycles = async () => {
		axios.get("http://127.0.0.1:8080/cycles").then((res) => {
			console.log(res.data);
			setCycleNodes(res.data.cycles);
		});
	};

	const fetchHITS = async () => {
		axios.get("http://127.0.0.1:8080/hits").then((res) => {
			console.log(res.data);
			setHubs(res.data.hubs);
			setAuthorities(res.data.authorities);
		});
	};

	const fetchPageRank = async () => {
		axios.get("http://127.0.0.1:8080/").then((res) => {
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
		fetchVolumes(selectedFiles);
		fetchCycles();
	};

  return (
    <div className={styles.pageContainer}>
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
          <input type="file" onChange={changeHandler} />
          <input
            type="text"
            onChange={(e) => setAccountNo(e.target.value)}
            value={accountNo}
          />
          <button className={styles.btn} onClick={fetchData}>
            Get Details
          </button>
          <div>
            <div>
              {/*Spending history*/}

              <img src={spendsGraph} alt="Bar Plot" />
            </div>
            <div>
              {/*Balance history*/}
              {balanceGraph && <img src={balanceGraph} alt="Bar Plot" />}
            </div>
          </div>
        </div>
				<div className={styles.ml}>
					<div>{/* Fraud Patterns*/}</div>
					<div>
						{/* Cycle Patterns*/}
						{cycleNodes.map((val, index) => {
							return (
								<div>
									<h2>Cycle {index + 1}: </h2>
									<div>
										{val.nodes.map((node, i) => {
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
					<div>
						{/* HITS*/}
						<h2>
							According to HITS we got the following nodes as Hubs
							and authorities:
						</h2>
						<div>
							<h5>Hubs</h5>
							{Object.keys(hubs).map((key, i) => {
								if (hubs[key] > 0.1) {
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
							<h5>Hubs</h5>
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
					<div>
						{/* PageRank */}
						<h2>
							According to Page rank we got the following nodes:
						</h2>

						<div>
							<h5>Hubs</h5>
							{pageRanks.nodes && pageRanks.nodes.map((val, i) => {
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

export default Report;
