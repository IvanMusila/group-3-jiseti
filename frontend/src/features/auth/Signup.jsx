import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { signup } from "./authSlice";

export default function Signup() {
  const [form, setForm] = useState({username:"",email:"",password:""});
  const dispatch = useDispatch();

  const handle = e => setForm({...form,[e.target.name]: e.target.value});
  const submit = async e => {
    e.preventDefault();
    await dispatch(signup(form));
    alert("Signup complete. Now login.");
  };

  return (
    <form onSubmit={submit}>
      <h3>Signup</h3>
      <input name="username" placeholder="username" onChange={handle} />
      <input name="email" placeholder="email" onChange={handle} />
      <input name="password" placeholder="password" type="password" onChange={handle} />
      <button type="submit">Signup</button>
    </form>
  );
}
