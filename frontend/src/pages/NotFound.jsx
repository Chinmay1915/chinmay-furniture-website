import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-page py-12">
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="mt-2">
        Go back <Link to="/">home</Link>
      </p>
    </div>
  );
}
