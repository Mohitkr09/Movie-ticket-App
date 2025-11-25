import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoadingRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/my-bookings");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen text-white text-xl">
      Processing your payment...
    </div>
  );
}
