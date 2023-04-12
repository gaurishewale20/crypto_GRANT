import React, { useState, useMemo, useCallback, useEffect } from "react";
import styles from "./Visualize.module.css";
import logo from "../../assets/logo.svg";
import { ForceGraph2D } from "react-force-graph";
import { SizeMe } from "react-sizeme";
import axios from "axios";
import { graph } from "neo4j-driver";

const Visualize = () => {

    const [suspiciousAccounts, setSuspiciousAccounts] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [graphData, setGraphData] = useState({nodes: [], links: []});

    const NODE_R = 8;
    const data = useMemo(() => {
        const gData = graphData;

        // cross-link node objects
        gData.links.forEach((link) => {
            const a = gData.nodes.find((d) => d.id === link.source);
            const b = gData.nodes.find((d) => d.id === link.target);
            //   const a = gData.nodes[link.source];
            //   const b = gData.nodes[link.target];
            !a.neighbors && (a.neighbors = []);
            !b.neighbors && (b.neighbors = []);
            a.neighbors.push(b);
            b.neighbors.push(a);

            !a.links && (a.links = []);
            !b.links && (b.links = []);
            a.links.push(link);
            b.links.push(link);
        });

        return gData;
    }, [graphData]);

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
                        Suspicious Accounts
                    </span>
                    {suspiciousAccounts.map((item, index) => {
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
                                        node.group == 4 ? "red" : "#4573ff"
                                    }
                                    linkColor={(link) => "#656565"}
                                    linkDirectionalArrowLength={3.5}
                                    linkDirectionalArrowRelPos={1}
                                    linkCurvature={0.25}
                                    nodeRelSize={NODE_R}
                                    autoPauseRedraw={false}
                                    linkWidth={(link) =>
                                        highlightLinks.has(link) ? 5 : 1
                                    }
                                    linkDirectionalParticles={3}
                                    linkDirectionalParticleColor={"#ff2929"}
                                    linkDirectionalParticleWidth={(link) =>
                                        highlightLinks.has(link) ? 4 : 0
                                    }
                                    nodeCanvasObjectMode={(node) =>
                                        highlightNodes.has(node)
                                            ? "before"
                                            : undefined
                                    }
                                    nodeCanvasObject={paintRing}
                                    onNodeClick={handleNodeClick}
                                    onNodeHover={handleNodeHover}
                                    onLinkHover={handleLinkHover}
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
