import React, { useState, useMemo, useCallback, useEffect } from "react";
import styles from "./Visualize.module.css";
import logo from "../../assets/logo.svg";
import { ForceGraph2D } from "react-force-graph";
import { SizeMe } from "react-sizeme";
import axios from "axios";
import { graph } from "neo4j-driver";
import { styled } from '@mui/material/styles';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import NativeSelect from '@mui/material/NativeSelect';
import InputBase from '@mui/material/InputBase';

const BootstrapInput = styled(InputBase)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(3),
  },
  '& .MuiInputBase-input': {
    width: '100%',
    borderRadius: 4,
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    border: '1px solid #ced4da',
    fontSize: 16,
    padding: '10px 26px 10px 12px',
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    // Use the system font instead of the default Roboto font.
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    '&:focus': {
        backgroundColor: theme.palette.background.paper,
      borderRadius: 4,
      borderColor: '#80bdff',
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
    },
  },
}));

const Visualize = () => {

    const [suspiciousAccounts, setSuspiciousAccounts] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [graphData, setGraphData] = useState({nodes: [], links: []});
    const [fraudPattern, setFraudPattern] = useState("None");
    const patterns = ["Cyclic Flow", "Money Laundering"];
    const [suspiciousNodes, setSuspiciousNodes] = useState([]);

    const NODE_R = 8;
    const data = useMemo(() => {
        const gData = graphData;

        
        gData.nodes.forEach((node) => {
            if(suspiciousNodes.find((sNode) => sNode.id == node.id)){
                node.color = '#ff5b5b';
            }else{
                node.color = '#5650ff'
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
    }, [graphData, suspiciousNodes]);

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
                setSuspiciousAccounts(res.data.nodes);
            })
            .catch((err) => {
                console.log(err.response.data.detail);
            });
    };

    useEffect(() => {
        handleFetchGraph();
    }, []);

    const fetchCyclicFlow = async () => {
        try{
            const res = await axios.get('http://localhost:5000/getCycles');
            console.log(res.data);
            const cyclesList = res.data;
            const tempSuspiciousList = [];
            cyclesList.forEach((cycle) => {
                cycle.forEach((node) => {
                    if(!tempSuspiciousList.find((n) => n.id == node.id)){
                        tempSuspiciousList.push(node);
                    }
                })
            })
            setSuspiciousNodes(tempSuspiciousList);
        }catch(e){
            console.log(e);
        }
    };

    const fetchPageRank = async () => {
        try {
            const res = await axios.get('http://localhost:5000/pageRank');
            console.log(res.data);
        } catch(e){
            console.log(e);
        }
    }

    useEffect(() => {
        console.log(fraudPattern);
        if(fraudPattern == "None"){
            setSuspiciousNodes([]);
        }else if(fraudPattern == "Cyclic Flow"){
            fetchCyclicFlow();
        }else if(fraudPattern == "Money Laundering"){
            fetchPageRank();
        }
    }, [fraudPattern]);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.logoContainer}>
                <img src={logo} alt="" />
            </div>

            <div className={styles.toolbarContainer}>
                <div className={styles.genReportTool}>Generate Reports</div>
            </div>
            <div className={styles.workspaceContainer}>
                <div className={styles.sidebarContainer}>
                    <span className={styles.sectionHeader}>
                        Common Fraud Patterns
                    </span>
                    <FormControl width={'200px'} sx={{ mb: 3 }} variant="standard">
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
                            {
                                patterns.map((patternName) => <MenuItem value={patternName}>{patternName}</MenuItem>)
                            }
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
                                        1555834834
                                    </span>
                                    <span className={styles.accountName}>
                                        Ravi Maurya
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
                                        1555834834
                                    </span>
                                    <span className={styles.accountName}>
                                        Ravi Maurya
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className={styles.graphContainer}>
                    <SizeMe>
                        {({ size }) => (
                            <>
                                <ForceGraph2D
                                    width={size.width}
                                    graphData={data}
                                    nodeColor={(node) =>
                                        node.color
                                    }
                                    linkColor={(link) => "#656565"}
                                    linkDirectionalArrowLength={3.5}
                                    linkDirectionalArrowRelPos={1}
                                    linkCurvature="curvature"
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
