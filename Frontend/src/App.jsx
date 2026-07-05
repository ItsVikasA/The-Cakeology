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


  if (Loading == true) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center', padding: '24px' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #eee', borderTopColor: '#e75480', borderRadius: '50%', animation: 'cakeologySpin 1s linear infinite' }} />
      <p style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>Warming things up…</p>
      <p style={{ fontSize: 13, color: '#777', maxWidth: 320 }}>The first load can take up to a minute while the server wakes up. Thanks for your patience.</p>
      <style>{`@keyframes cakeologySpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div>
      <Landing />
    </div>
  )
}

export default App