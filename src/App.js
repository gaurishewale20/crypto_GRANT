import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./components/Home/Home";
import Visualize from "./components/Visualize/Visualize";
import Report from "./components/Report/Report";
import Dashboard from "./components/Dashboard/Dashboard";

function App() {
	const router = createBrowserRouter([
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
