import React from "react";
import styles from "./LandingPage.module.css";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";


const LandingPage = () => {
	const navigate = useNavigate();

    const handleRegisterClick = () => {
        navigate('/signup');
    }

    const handleLoginClick = () => {
        navigate('/login');
    }

	return (
		<div className={styles.main}>
			<div className={styles.container}>
				<div className={styles.logoContainer}>
					<img src={logo} alt="" />
				</div>
				<div className={styles.description}>
					Detecting Bank Frauds using Graphs
				</div>
                <div className={styles.actionContainer}>
                    <button className={styles.uploadBtn} onClick={handleRegisterClick}>
                        Register <ArrowForwardIcon style={{marginLeft: '0.8rem'}} />
                    </button>
                    <button className={styles.uploadBtn} onClick={handleLoginClick}>
                        Login <ArrowForwardIcon style={{marginLeft: '0.8rem'}} />
                    </button>
                </div>
			</div>
		</div>
	);
};

export default LandingPage;
