import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./components/Home/Home";
import Visualize from "./components/Visualize/Visualize";
import Report from "./components/Report/Report";
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";

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
			path: "/visualize",
			element: (
				<>
					<Visualize />
				</>
			),
		},
		{
			path: "/report",
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
		}
	]);

	return (
		<div className="App">
			<RouterProvider router={router}></RouterProvider>
		</div>
	);
}

export default App;
