import { Logo } from "../Icons/Logo";

export function HomeHeader({ fixed }: { fixed?: boolean }) {
  return (
    <header
      className={`${
        fixed ? "fixed" : ""
      } z-20 flex h-12 justify-center  bg-indigo-700 flex-col`}
    >
      <div className="flex items-center justify-between w-screen px-4">
        <div className="flex gap-1 sm:gap-1.5 h-8 justify-center items-center">
          <div className="w-24 sm:w-32">
            <Logo />
          </div>
        </div>
      </div>
    </header>
  );
}
