export function InterfaceIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={props.className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 4h16v2H4V4zm0 4h16v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z"
        fill="currentColor"
      />
      <path
        d="M16 18h2v2h-2v-2zm4 0h2v2h-2v-2z"
        fill="currentColor"
      />
    </svg>
  );
}

