import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "./authSlice";

export default function Login() {
  const [form, setForm] = useState({email:"",password:""});
  const dispatch = useDispatch();
  const handle = e => setForm({...form,[e.target.name]: e.target.value});
  const submit = async e => {
    e.preventDefault();
    const res = await dispatch(login(form));
    if (res.error) alert("Login failed");
    else alert("Login ok");
  };

  return (
    <form onSubmit={submit}>
      <h3>Login</h3>
      <input name="email" placeholder="email" onChange={handle} />
      <input name="password" placeholder="password" type="password" onChange={handle} />
      <button type="submit">Login</button>
    </form>
  );
}
