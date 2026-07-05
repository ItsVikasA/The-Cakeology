import { useEffect, useState } from "react";
import useAuth from "./Features/Authentication/Hook/useAuth"
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Landing from "./Features/Landing/Pages/Landing";
import useProduct from "./Features/Products/Hook/useProduct";


const App = () => {

  const navigate = useNavigate();
  const { getMeHandler, protectedRouteHandler } = useAuth();
  const User = useSelector((state) => { return state.auth.User });
  const Loading = useSelector((state) => { return state.auth.Loading });
  const { ProductsHandler } = useProduct();


  useEffect(() => {
    ProductsHandler();
    getMeHandler();
  }, []);


  if (Loading == true) return <div>Loading...</div>

  return (
    <div>
      <Landing />
    </div>
  )
}

export default App