// Espaço reservado para o gráfico de faturamento (endpoint /home/finance).
// Combinado: por enquanto não implementar a lógica do gráfico em si,
// só deixar o card com o tamanho/posição corretos para plugar depois.
export default function RevenueChartCard() {
  return (
    <div className="dash-card revenue-card">
      <div className="dash-card-header">
        <span className="dash-card-title">Faturamento</span>
        <select className="filter-select" disabled defaultValue="mes">
          <option value="mes">Este mês</option>
        </select>
      </div>

      <div className="revenue-placeholder">
        <i className="ti ti-chart-line" aria-hidden="true" />
        <span>Gráfico de faturamento em breve</span>
      </div>
    </div>
  );
}
