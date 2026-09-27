import { useState } from "react";
import "./Dashboard.css";

import StatCards from "../../Components/dashboard/StatCards";
import DateRangePicker from "../../Components/dashboard/DateRangePicker";
import RevenueExpenseChart from "../../Components/dashboard/RevenueExpenseChart";
import AppointmentsStatusDonut from "../../Components/dashboard/AppointmentsStatusDonut";
import AttendanceByMonthChart from "../../Components/dashboard/AttendanceByMonthChart";
import ProceduresChart from "../../Components/dashboard/ProceduresChart";
import DentistsChart from "../../Components/dashboard/DentistsChart";

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);
  const toISO = (d) => d.toISOString().slice(0, 10);
  return { startDate: toISO(start), endDate: toISO(end) };
}

export default function Dashboard() {
  const [{ startDate, endDate }, setRange] = useState(defaultRange());

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Visão geral da sua clínica</p>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={setRange}
        />
      </div>

      <StatCards startDate={startDate} endDate={endDate} />

      <div className="dash-row">
        <RevenueExpenseChart startDate={startDate} endDate={endDate} />
        <AppointmentsStatusDonut startDate={startDate} endDate={endDate} />
      </div>

      <div className="dash-row">
        <AttendanceByMonthChart startDate={startDate} endDate={endDate} />
      </div>

      <div className="dash-row">
        <ProceduresChart startDate={startDate} endDate={endDate} />
        <DentistsChart startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
}
