import React, { useState, useMemo, useEffect, useCallback } from "react";
import styles from "./Visualize.module.css";
import logo from "../../assets/logo.svg";
import { ForceGraph2D } from "react-force-graph";
import { SizeMe } from "react-sizeme";
import axios from "axios";
import { graph } from "neo4j-driver";
import { styled } from "@mui/material/styles";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import NativeSelect from "@mui/material/NativeSelect";
import InputBase from "@mui/material/InputBase";
import Switch from "@mui/material/Switch";
import { useNavigate } from "react-router-dom";

const BootstrapInput = styled(InputBase)(({ theme }) => ({
	"label + &": {
		marginTop: theme.spacing(3),
	},
	"& .MuiInputBase-input": {
		width: "100%",
		borderRadius: 4,
		position: "relative",
		backgroundColor: theme.palette.background.paper,
		border: "1px solid #ced4da",
		fontSize: 16,
		padding: "10px 26px 10px 12px",
		transition: theme.transitions.create(["border-color", "box-shadow"]),
		// Use the system font instead of the default Roboto font.
		fontFamily: [
			"-apple-system",
			"BlinkMacSystemFont",
			'"Segoe UI"',
			"Roboto",
			'"Helvetica Neue"',
			"Arial",
			"sans-serif",
			'"Apple Color Emoji"',
			'"Segoe UI Emoji"',
			'"Segoe UI Symbol"',
		].join(","),
		"&:focus": {
			backgroundColor: theme.palette.background.paper,
			borderRadius: 4,
			borderColor: "#80bdff",
			boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
		},
	},
}));

const Visualize = () => {
	const [allAccounts, setAllAccounts] = useState([]);
	const [graphData, setGraphData] = useState({ nodes: [], links: [] });
	const [fraudPattern, setFraudPattern] = useState("None");
	const patterns = [
		"Cyclic Flow",
		"Money Laundering",
		"Hits",
		"Geographic",
		"Cluster",
	];
	const [suspiciousNodes, setSuspiciousNodes] = useState([]);
	const [suspiciousLinks, setSuspiciousLinks] = useState([]);
	const [isIncoming, setIsIncoming] = useState(false);
	const [hoveredElm, setHoveredElm] = useState();
	const navigate = useNavigate();

	const [user, setUser] = useState({});
	const [token, setToken] = useState("");
	const [investigation, setInvestigation] = useState({});
	const [file, setFile] = useState();

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
					Authorization: `Bearer ${token}`,
				},
			})
			.then((res) => {
				console.log(res.data.investigation.file);

				setInvestigation(res.data.investigation);
				setFile(base64toFile(res.data.investigation.file, "input"));
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
			fetchInvestigation();
		};

		onLoad();
	}, []);

	const NODE_R = 8;
	const data = useMemo(() => {
		const gData = graphData;

		gData.nodes.forEach((node) => {
			if (suspiciousNodes.find((sNode) => sNode.id == node.id)) {
				node.color = "#ff5b5b";
			} else {
				node.color = "#5650ff";
			}
		});
		gData.links.forEach((link) => {
			if (suspiciousLinks.find((sLink) => sLink == link.refNo)) {
				link.color = "#ff5b5b";
			} else {
				link.color = "#656565";
			}
		});
		console.log(gData);
		// cross-link node objects
		// gData.links.forEach((link) => {
		//     const a = gData.nodes.find((d) => d.id === link.source);
		//     const b = gData.nodes.find((d) => d.id === link.target);
		//     console.log(a)
		//     console.log(b)
		//     //   const a = gData.nodes[link.source];
		//     //   const b = gData.nodes[link.target];
		//     !a.neighbors && (a.neighbors = []);
		//     !b.neighbors && (b.neighbors = []);
		//     a.neighbors.push(b);
		//     b.neighbors.push(a);

		//     !a.links && (a.links = []);
		//     !b.links && (b.links = []);
		//     a.links.push(link);
		//     b.links.push(link);
		// });
		return gData;
	}, [graphData, suspiciousNodes, suspiciousLinks]);

	const [highlightNodes, setHighlightNodes] = useState(new Set());
	const [highlightLinks, setHighlightLinks] = useState(new Set());
	const [hoverNode, setHoverNode] = useState(null);

	const updateHighlight = () => {
		setHighlightNodes(highlightNodes);
		setHighlightLinks(highlightLinks);
	};

	const handleNodeClick = (node) => {
		console.log(node);
	};

	const handleNodeHover = (node) => {
		// console.log(node);
		highlightNodes.clear();
		highlightLinks.clear();
		if (node) {
			highlightNodes.add(node);
			node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor));
			node.links.forEach((link) => highlightLinks.add(link));
		}

		setHoverNode(node || null);
		updateHighlight();
	};

	const handleLinkHover = (link) => {
		highlightNodes.clear();
		highlightLinks.clear();

		if (link) {
			highlightLinks.add(link);
			highlightNodes.add(link.source);
			highlightNodes.add(link.target);
		}

		updateHighlight();
	};

	const paintRing = useCallback(
		(node, ctx) => {
			// add ring just for highlighted nodes
			ctx.beginPath();
			ctx.arc(node.x, node.y, NODE_R * 1.4, 0, 2 * Math.PI, false);
			ctx.fillStyle = node === hoverNode ? "red" : "orange";
			ctx.fill();
		},
		[hoverNode]
	);

	const handleFetchGraph = async () => {
		await axios
			.get("http://localhost:5000/")
			.then((res) => {
				console.log(res);
				setGraphData(res.data);
				setAllAccounts(res.data.nodes);
			})
			.catch((err) => {
				console.log(err.response.data.detail);
			});
	};

	useEffect(() => {
		handleFetchGraph();
	}, []);

	const fetchCyclicFlow = async () => {
		try {
			const res = await axios.get("http://localhost:8080/cycles");
			console.log(res.data);
			const cyclesList = res.data.cycles;
			const tempSuspiciousList = [];
			const tempSuspiciousTxn = [];
			cyclesList.forEach((cycle) => {
				cycle.nodes.forEach((node) => {
					tempSuspiciousList.push(
						data.nodes.find((n) => n.id == node)
					);
				});
				tempSuspiciousTxn.push(...cycle.transactions);
			});
			setSuspiciousNodes(tempSuspiciousList);
			setSuspiciousLinks(tempSuspiciousTxn);
		} catch (e) {
			console.log(e);
		}
	};

	const fetchPageRank = async () => {
		try {
			const res = await axios.get("http://localhost:8080/pageRank");
			console.log(res.data);
			const tempSuspiciousList = [];
			const rankData = res.data;
			rankData.nodes.forEach((node, index) => {
				if (rankData.scores[index] > 0.3) {
					tempSuspiciousList.push(
						data.nodes.find((n) => n.id == node)
					);
				}
			});
			console.log(tempSuspiciousList);
			setSuspiciousNodes(tempSuspiciousList);
			setSuspiciousLinks([]);
		} catch (e) {
			console.log(e);
		}
	};

	const fetchHits = async () => {
		try {
			const res = await axios.get("http://localhost:8080/hits");
			console.log(res.data);
		} catch (e) {
			console.log(e);
		}
	};

	const fetchGeographicFraud = async () => {
		try {
			const res = await axios.get("http://localhost:8080/location");
			const tempSuspiciousList = [];
			const locationData = res.data.locations_and_accounts;
			locationData.forEach((nodeLoc, index) => {
				tempSuspiciousList.push(
					data.nodes.find((n) => n.id == nodeLoc.node)
				);
			});
			setSuspiciousNodes(tempSuspiciousList);
			setSuspiciousLinks([]);
		} catch (e) {
			console.log(e);
		}
	};

	const fetchCluster = async () => {
		try {
			const res = await axios.get(
				"http://localhost:8080/connectedComponents"
			);
			console.log(res.data);
			const { components } = res.data;
			components.forEach((compList) => {
				const randomColor = Math.floor(
					Math.random() * 16777215
				).toString(16);
				compList.forEach((node) => {
					const newData = data.nodes.map((ogNode) => {
						if (ogNode.id == node) {
							ogNode.color = `#${randomColor}`;
						}
						return ogNode;
					});
					console.log(newData);
					data.nodes = newData;
				});
			});
		} catch (e) {
			console.log(e);
		}
	};

	const generateReport = () => {
		navigate(`/report/${investigation._id}`);
	};

	useEffect(() => {
		console.log(fraudPattern);
		if (fraudPattern == "None") {
			setSuspiciousNodes([]);
			setSuspiciousLinks([]);
		} else if (fraudPattern == "Cyclic Flow") {
			fetchCyclicFlow();
		} else if (fraudPattern == "Money Laundering") {
			fetchPageRank();
		} else if (fraudPattern == "Hits") {
			fetchHits();
		} else if (fraudPattern == "Geographic") {
			fetchGeographicFraud();
		} else if (fraudPattern == "Cluster") {
			setSuspiciousNodes([]);
			setSuspiciousLinks([]);
			fetchCluster();
		}
	}, [fraudPattern]);

	return (
		<div className={styles.pageContainer}>
			<div className={styles.logoContainer}>
				<img src={logo} alt="" />
			</div>

			<div className={styles.toolbarContainer}>
				<button
					className={styles.genReportTool}
					onClick={generateReport}
				>
					Generate Reports
				</button>
			</div>
			<div className={styles.workspaceContainer}>
				<div className={styles.sidebarContainer}>
					<span className={styles.sectionHeader}>
						Common Fraud Patterns
					</span>
					<FormControl
						width={"200px"}
						sx={{ mb: 3 }}
						variant="standard"
					>
						<Select
							labelId="demo-customized-select-label"
							id="demo-customized-select"
							value={fraudPattern}
							onChange={(e) => {
								setFraudPattern(e.target.value);
							}}
							input={<BootstrapInput />}
						>
							<MenuItem value="None">
								<em>None</em>
							</MenuItem>
							{patterns.map((patternName) => (
								<MenuItem value={patternName}>
									{patternName}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<span className={styles.sectionHeader}>
						Suspicious Accounts
					</span>
					{suspiciousNodes.map((item, index) => {
						return (
							<div id={index} className={styles.accountCard}>
								<div className={styles.accountIcon}></div>
								<div className={styles.accountInfo}>
									<span className={styles.accountNumber}>
										{item.id}
									</span>
								</div>
							</div>
						);
					})}
					<span className={styles.sectionHeader}>All Accounts</span>
					{allAccounts.map((item, index) => {
						return (
							<div id={index} className={styles.accountCard}>
								<div className={styles.allAccountIcon}></div>
								<div className={styles.accountInfo}>
									<span className={styles.accountNumber}>
										{item.id}
									</span>
								</div>
							</div>
						);
					})}
				</div>
				<div className={styles.graphContainer}>
					{fraudPattern == "Hits" ? (
						<div>
							<span>Outgoing</span>
							<Switch
								checked={isIncoming}
								onChange={(e) => {
									setIsIncoming(e.target.checked);
								}}
							/>
							<span>Incoming</span>
						</div>
					) : (
						<></>
					)}

					<SizeMe>
						{({ size }) => (
							<>
								<ForceGraph2D
									width={size.width}
									graphData={data}
									nodeColor={(node) => node.color}
									linkColor={(link) => link.color}
									linkDirectionalArrowLength={3.5}
									linkDirectionalArrowRelPos={1}
									linkCurvature="curvature"
									onNodeHover={(node) => {
										setHoveredElm(node);
									}}
									nodeLabel="id"
									linkLabel={(link) =>
										`₹${link.amount}<br/>${link.txnDate}`
									}
								/>
							</>
						)}
					</SizeMe>
				</div>
			</div>
		</div>
	);
};

export default Visualize;
