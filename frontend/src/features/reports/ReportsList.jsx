import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReports } from "./reportsSlice";

export default function ReportsList(){
  const dispatch = useDispatch();
  const { items } = useSelector(state => state.reports);

  useEffect(() => {
    dispatch(fetchReports({ page:1, per_page:10 }));
  }, [dispatch]);

  return (
    <div>
      <h3>Reports</h3>
      {items.map(r => (
        <div key={r.id} style={{border:"1px solid #ddd", padding:8, margin:6}}>
          <strong>{r.title}</strong>
          <div>{r.type} • {r.status}</div>
          <div>{r.description}</div>
          <div>{r.latitude},{r.longitude}</div>
        </div>
      ))}
    </div>
  );
}
