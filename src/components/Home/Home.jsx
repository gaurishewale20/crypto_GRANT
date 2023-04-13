import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./Home.module.css";
import axios from "../../helpers/axios";
import * as FileSaver from "file-saver";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";
import { useDropzone } from "react-dropzone";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const baseStyle = {
	flex: 1,
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	padding: "20px",
	borderRadius: "1rem",
	border: "2px dashed #e3e3e367",
	backgroundColor: "#ffffff2b",
	color: "#434343",
	outline: "none",
	transition: "border .24s ease-in-out",
	cursor: "pointer",
};

const focusedStyle = {
	borderColor: "#2196f3",
};

const acceptStyle = {
	borderColor: "#00e676",
};

const rejectStyle = {
	borderColor: "#ff1744",
};

const Home = () => {
	const navigate = useNavigate();
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [isSelected, setIsSelected] = useState(false);
	const [bankNames, setBankNames] = useState([]);
	const [accountNos, setAccountNos] = useState([]);
	const [csvData, setCsvData] = useState(null);

	const onDrop = useCallback(
		(acceptedFiles) => {
			console.log(acceptedFiles);
			if (selectedFiles.length === 0) {
				console.log("Hello1");
				setSelectedFiles([...acceptedFiles]);
				setBankNames(new Array(acceptedFiles.length).fill(""));
				setAccountNos(new Array(acceptedFiles.length).fill(""));
			} else {
				console.log("Hello2");
				setSelectedFiles((prevFiles) => {
					var newFiles = [];
					newFiles = [...prevFiles, ...acceptedFiles];
					return newFiles;
				});

				setBankNames((names) => {
					var newNames = [];
					newNames = [
						...names,
						...new Array(acceptedFiles.length).fill(""),
					];
					return newNames;
				});
				setAccountNos((nos) => {
					var newNos = [];
					newNos = [
						...nos,
						...new Array(acceptedFiles.length).fill(""),
					];
					return newNos;
				});
			}
			setIsSelected(true);
		},
		[selectedFiles]
	);

	const {
		acceptedFiles,
		getRootProps,
		getInputProps,
		isFocused,
		isDragAccept,
		isDragReject,
	} = useDropzone({ onDrop });

	const style = useMemo(
		() => ({
			...baseStyle,
			...(isFocused ? focusedStyle : {}),
			...(isDragAccept ? acceptStyle : {}),
			...(isDragReject ? rejectStyle : {}),
		}),
		[isFocused, isDragAccept, isDragReject]
	);

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
	const [user, setUser] = useState({});
	const [token, setToken] = useState("");

	useEffect(() => {
		const onLoad = () => {
			if (!window.localStorage.getItem("token")) {
				navigate("/login");
			} else {
				setToken(window.localStorage.getItem("token"));
				setUser(JSON.parse(window.localStorage.getItem("user")));
			}
		};

		onLoad();
	}, []);

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
				newFormData.append("name", "Investigation 1");

				axios
					.post("http://localhost:5000/", newFormData, {
						headers: {
							"Content-Type": "multipart/form-data",
							Authorization: `Bearer ${token}`,
						},
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
				<div className={styles.uploadArea} {...getRootProps({ style })}>
					<input {...getInputProps()} />
					{/* <UploadFile /> */}
					<p>Upload Excel, CSV or PDFs</p>
				</div>
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
										newAccountNos[index] = e.target.value;
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
					<></>
				)}
				<button className={styles.uploadBtn} onClick={handleSubmission}>
					Next <ArrowForwardIcon />
				</button>
			</div>
		</div>
	);
};

export default Home;
