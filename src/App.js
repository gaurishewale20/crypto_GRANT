import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./components/Home/Home";
import Visualize from "./components/Visualize/Visualize";
import Report from "./components/Report/Report";
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import Dashboard from "./components/Dashboard/Dashboard";
import LandingPage from "./components/LandingPage/LandingPage";

function App() {
	const router = createBrowserRouter([
		{
			path: "/landing",
			element: (
				<>
					<LandingPage />
				</>
			),
		},
		{
			path: "/",
			element: (
				<>
					<Home />
				</>
			),
		},
		{
			path: "/visualize/:id",
			element: (
				<>
					<Visualize />
				</>
			),
		},
		{
			path: "/report/:id",
			element: (
				<>
					<Report />
				</>
			),
		},
		{
			path:"/login",
			element:(
				<>
					<Login/>
				</>
			),
		},{
			path:"/signup",
			element:(
				<>
					<Signup/>
				</>
			)
		},{
			path: "/dashboard",
			element: (
				<>
					<Dashboard />
				</>
			),
		},
	]);

	return (
		<div className="App">
			<RouterProvider router={router}></RouterProvider>
		</div>
	);
}

export default App;
