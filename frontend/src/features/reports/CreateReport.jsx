import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createReport } from "./reportsSlice";

export default function CreateReport() {
  const [form, setForm] = useState({type:"redflag", title:"", description:"", latitude:"", longitude:""});
  const dispatch = useDispatch();

  const handle = e => setForm({...form, [e.target.name]: e.target.value});
  const submit = async e => {
    e.preventDefault();
    await dispatch(createReport(form));
    alert("Report created");
  };

  return (
    <form onSubmit={submit}>
      <h3>Create report</h3>
      <select name="type" onChange={handle} value={form.type}>
        <option value="redflag">Red-flag</option>
        <option value="intervention">Intervention</option>
      </select>
      <input name="title" placeholder="title" onChange={handle} />
      <textarea name="description" placeholder="description" onChange={handle} />
      <input name="latitude" placeholder="latitude" onChange={handle} />
      <input name="longitude" placeholder="longitude" onChange={handle} />
      <button type="submit">Submit</button>
    </form>
  );
}
