import React, { useState } from "react";
import styles from "./Home.module.css";
import axios from "../../helpers/axios";
import * as FileSaver from "file-saver";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";

const Home = () => {
	const navigate = useNavigate();
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [isSelected, setIsSelected] = useState(false);
	const [bankNames, setBankNames] = useState([]);
	const [accountNos, setAccountNos] = useState([]);
	const [csvData, setCsvData] = useState(null);

	const bankOptions = [
		{
			key: "HDFC",
			value: "HDFC",
		},
		{
			key: "ICICI",
			value: "ICICI",
		},
		{
			key: "SBI",
			value: "SBI",
		},
	];

	const changeHandler = (event) => {
		console.log(event.target.files);
		if (selectedFiles.length === 0) {
			console.log("Hello1");
			setSelectedFiles([...event.target.files]);
			setBankNames(new Array(event.target.files.length).fill(""));
			setAccountNos(new Array(event.target.files.length).fill(""));
		} else {
			console.log("Hello2");
			setSelectedFiles((prevFiles) => {
				var newFiles = [];
				newFiles = [...prevFiles, ...event.target.files];
				return newFiles;
			});

			setBankNames((names) => {
				var newNames = [];
				newNames = [
					...names,
					...new Array(event.target.files.length).fill(""),
				];
				return newNames;
			});
			setAccountNos((nos) => {
				var newNos = [];
				newNos = [
					...nos,
					...new Array(event.target.files.length).fill(""),
				];
				return newNos;
			});
		}
		setIsSelected(true);
	};

	const handleSubmission = async (e) => {
		e.preventDefault();

		var formData = new FormData();
		for (let i = 0; i < selectedFiles.length; i++) {
			formData.append("files", selectedFiles[i]);
			formData.append("bankNames", bankNames[i]);
			formData.append("accountNos", accountNos[i]);
		}

		axios
			.post("http://127.0.0.1:8080/preprocess_csv_files", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			})
			.then((res) => {
				const blob = new Blob([res.data.result_csv], {
					type: "text/csv",
				});

				var newFormData = new FormData();
				newFormData.append("files", blob);

				axios
					.post("http://localhost:5000/", newFormData, {
						headers: { "Content-Type": "multipart/form-data" },
					})
					.then((res) => {
						console.log(res);
						navigate("/visualize");
					})
					.catch((err) => {
						console.log(err);
					});

				FileSaver.saveAs(blob, "preprocessed_data.csv");
				setCsvData(res.data.result_csv);
			})
			.catch((err) => {
				console.log(err.response.data.detail);
			});
	};

	const handleView = async (e) => {
		e.preventDefault();

		var formData = new FormData();
		for (let i = 0; i < selectedFiles.length; i++) {
			formData.append("files", selectedFiles[i]);
			formData.append("bankNames", bankNames[i]);
		}

		console.log(selectedFiles[0], bankNames[0]);

		axios
			.get("/")
			.then((res) => {
				console.log(res);
			})
			.catch((err) => {
				console.log(err.response.data.detail);
			});
	};

	return (
		<div className={styles.main}>
			<div className={styles.container}>
				<div className={styles.logoContainer}>
					<img src={logo} alt="" />
				</div>
				<div className={styles.description}>
					Detecting Bank Frauds using Graphs
				</div>
				<div>
					<input
						type="file"
						name="file"
						multiple="multiple"
						onChange={changeHandler}
					/>
					{isSelected ? (
						selectedFiles.map((val, index) => (
							<div key={index}>
								<p>Filename: {val.name}</p>
								<select
									onChange={(e) => {
										setBankNames((names) => {
											var newNames = [];
											newNames = [...names];
											newNames[index] = e.target.value;
											return newNames;
										});
									}}
								>
									<option value={""}>Select</option>
									{bankOptions.map((val, index) => (
										<option key={index} value={val.value}>
											{val.key}
										</option>
									))}
								</select>
								<input
									type="text"
									name="accountNo"
									value={accountNos[index]}
									onChange={(e) => {
										setAccountNos((accountNos) => {
											var newAccountNos = [];
											newAccountNos = [...accountNos];
											newAccountNos[index] =
												e.target.value;
											return newAccountNos;
										});
									}}
								/>
								<button
									onClick={(e) => {
										e.preventDefault();
										console.log("Hello");
										setSelectedFiles((prevFiles) => {
											var newFiles = [];
											for (let i = 0; i < index; i++) {
												newFiles.push(prevFiles[i]);
											}
											for (
												let i = index + 1;
												i < selectedFiles.length;
												i++
											) {
												newFiles.push(prevFiles[i]);
											}

											return newFiles;
										});
									}}
								>
									Remove
								</button>
							</div>
						))
					) : (
						<p>Select a file to show details</p>
					)}
					<div>
						<button
							className={styles.uploadBtn}
							onClick={handleSubmission}
						>
							Upload
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Home;
