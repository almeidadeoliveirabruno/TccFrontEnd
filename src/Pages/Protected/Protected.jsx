import React from "react";

function Protected() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Área protegida</h1>
      <p>Você está autenticado e pode acessar esta página.</p>
    </div>
  );
}

export default Protected;
