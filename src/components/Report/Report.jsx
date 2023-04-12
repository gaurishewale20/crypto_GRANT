import React,{useState, useEffect} from 'react'
import styles from "./Report.module.css";
import logo from "../../assets/logo.svg";

const Report = () => {
  return (
    <div className={styles.pageContainer}>
        <div className={styles.logoContainer}>
            <img src={logo} alt="" />
        </div>
        <div className={styles.workspaceContainer}>
            <div className={styles.allAccountsTxnCount}>
            <div>{/*  All Accounts*/}</div>
                    {/* Displays find Volume data */}
            </div>
            <div className={styles.selectedUsergraphs}>
                <div>{/*Balance history*/}</div>
                <div>{/*Spending history*/}</div>
            </div>
            <div className={styles.ml}>
                <div>{/* Fraud Patterns*/}</div>
                <div>{/* HITS*/}</div>
                <div>{/* PageRank */}</div>
            </div>
        </div>
    </div>
  )
}

export default Report