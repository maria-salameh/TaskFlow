// role="alert" : le message est annoncé par les lecteurs d'écran
export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="error-message" role="alert">
      <p>{message}</p>
    </div>
  );
}
