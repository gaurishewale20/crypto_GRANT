import './App.css';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from './components/Home/Home';
import Visualize from './components/Visualize/Visualize';

function App() {
  const router = createBrowserRouter([
    {
      path:"/",
      element:(
        <>
        <Home/>
        </>
      ),
    },
    {
      path:"/visualize",
      element:(
        <>
        <Visualize/>
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