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
  const [transactions, setTransactions] = useState([]);
  const [mean, setMean] = useState([]);
  const [balanceGraph, setBalanceGraph] = useState("");
  const [spendsGraph, setSpendsGraph] = useState("");

  const changeHandler = (event) => {
    setSelectedFiles(event.target.files[0]);
  };

  const fetchData = async () => {
    fetchSpends(selectedFiles, accountNo);
    fetchBalanceHistory(selectedFiles, accountNo);
    fetchVolumes(selectedFiles);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.logoContainer}>
        <img src={logo} alt="" />
      </div>
      <div className={styles.workspaceContainer}>
        <div className={styles.allAccountsTxnCount}>
          {/* <div>
				<div>Ankit</div>
				<input type="file" onChange={changeHandler} />
				<button onClick={fetchData}>Fetch Data</button>
			</div> */}
          <div>{/*  All Accounts*/}</div>
          {/* Displays find Volume data */}

          {transactions.length ? (
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
                      <td>{incomingCount[key] ? incomingCount[key] : 0}</td>
                      <td>{outgointCount[key] ? outgointCount[key] : 0}</td>
                      <td>{transactions[key]}</td>
                      <td>{mean[key] ? mean[key] : 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
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
          <div>{/* HITS*/}</div>
          <div>{/* PageRank */}</div>
        </div>
      </div>
    </div>
  );
};

export default Report;
