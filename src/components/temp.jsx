import React, { useState } from "react";
import axios from "axios";

const Temp = () => {
	const fetchVolumes = async (csvFile) => {
		const formData = new FormData();
		console.log(csvFile);
		formData.append("file", csvFile);
		axios
			.post("http://127.0.0.1:8080/findVolumes", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			})
			.then((res) => {
				console.log(res);
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
				console.log(res);
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
				console.log(res);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const [selectedFiles, setSelectedFiles] = useState([]);

	const changeHandler = (event) => {
		setSelectedFiles(event.target.files[0]);
	};

	const fetchData = async () => {
		fetchSpends(selectedFiles, "1234");
		fetchBalanceHistory(selectedFiles, "1234");
		fetchVolumes(selectedFiles);
	};

	return (
		<div>
			<div>Ankit</div>
			<input type="file" onChange={changeHandler} />
			<button onClick={fetchData}>Fetch Data</button>
		</div>
	);
};

export default Temp;
