import { Link } from "remix";

export function Logo({
  className,
  width = "100%",
}: {
  className?: string;
  width?: string;
}) {
  return (
    <Link to="/" aria-label="web-tools" className="w-40 font-bold">
      web-tools
    </Link>
  );
}
