import "./Toast.css";

export default function Toast({ message, type, visible }) {
  return (
    <div className={`toast ${type} ${visible ? "show" : ""}`}>
      {message}
    </div>
  );
}