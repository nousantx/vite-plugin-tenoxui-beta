export default function App() {
  return (
    <div className="relative grid min-h-screen grid-cols-[1fr_2.5rem_auto_2.5rem_1fr] grid-rows-[1fr_1px_auto_1px_1fr] bg-white _color-(--pattern-fg:{gray-950})/5  dark:bg-gray-950 dark:_color-(--pattern-fg:white)/10">
      <div className="col-start-3 row-start-3 flex max-w-lg flex-col bg-gray-100 p-2 dark:bg-white/10">
        <div className="rounded-xl bg-white p-10 text-sm/7 text-gray-700 dark:bg-gray-950 dark:text-gray-300">
          <img
            src="https://play.tailwindcss.com/img/logo.svg"
            className="mb-11.5 h-6 dark:hidden"
            alt="Tailwind Play"
          />
          <img
            src="https://play.tailwindcss.com/img/logo-dark.svg"
            className="mb-11.5 h-6 light:hidden"
            alt="Tailwind Play"
          />
          <div className="space-y-6">
            <p>
              An advanced online playground for Tailwind CSS, including support for things like:
            </p>
            <ul className="space-y-3">
              <li className="flex">
                <svg
                  className="h-[1lh] w-5.5 shrink-0"
                  viewBox="0 0 22 22"
                  fill="none"
                  stroke-linecap="square"
                >
                  <circle cx="11" cy="11" r="11" className="fill-sky-400/25" />
                  <circle cx="11" cy="11" r="10.5" className="stroke-sky-400/25" />
                  <path d="M8 11.5L10.5 14L14 8" className="stroke-sky-800 dark:stroke-sky-300" />
                </svg>
                <p className="ml-3">
                  Customizing your theme with{' '}
                  <code className="font-mono font-medium text-gray-950 dark:text-white">
                    @theme
                  </code>
                </p>
              </li>
              <li className="flex">
                <svg
                  className="h-[1lh] w-5.5 shrink-0"
                  viewBox="0 0 22 22"
                  fill="none"
                  stroke-linecap="square"
                >
                  <circle cx="11" cy="11" r="11" className="fill-sky-400/25" />
                  <circle cx="11" cy="11" r="10.5" className="stroke-sky-400/25" />
                  <path d="M8 11.5L10.5 14L14 8" className="stroke-sky-800 dark:stroke-sky-300" />
                </svg>
                <p className="ml-3">
                  Adding custom utilities with{' '}
                  <code className="font-mono font-medium text-gray-950 dark:text-white">
                    @utility
                  </code>
                </p>
              </li>
              <li className="flex">
                <svg
                  className="h-[1lh] w-5.5 shrink-0"
                  viewBox="0 0 22 22"
                  fill="none"
                  stroke-linecap="square"
                >
                  <circle cx="11" cy="11" r="11" className="fill-sky-400/25" />
                  <circle cx="11" cy="11" r="10.5" className="stroke-sky-400/25" />
                  <path d="M8 11.5L10.5 14L14 8" className="stroke-sky-800 dark:stroke-sky-300" />
                </svg>
                <p className="ml-3">
                  Adding custom variants with{' '}
                  <code className="font-mono font-medium text-gray-950 dark:text-white">
                    @variant
                  </code>
                </p>
              </li>
              <li className="flex">
                <svg
                  className="h-[1lh] w-5.5 shrink-0"
                  viewBox="0 0 22 22"
                  fill="none"
                  stroke-linecap="square"
                >
                  <circle cx="11" cy="11" r="11" className="fill-sky-400/25" />
                  <circle cx="11" cy="11" r="10.5" className="stroke-sky-400/25" />
                  <path d="M8 11.5L10.5 14L14 8" className="stroke-sky-800 dark:stroke-sky-300" />
                </svg>
                <p className="ml-3">Code completion with instant preview</p>
              </li>
            </ul>
            <p>
              Perfect for learning how the framework works, prototyping a new idea, or creating a
              demo to share online.
            </p>
          </div>
          <hr className="my-6 w-full border-(--pattern-fg)" />
          <p className="mb-3">Want to dig deeper into Tailwind?</p>
          <p className="font-semibold">
            <a
              href="https://tailwindcss.com/docs"
              className="text-gray-950 underline decoration-sky-400 underline-offset-3 hover:decoration-2 dark:text-white"
            >
              Read the docs &rarr;
            </a>
          </p>
        </div>
      </div>
      <div className="relative right--1px col-start-2 row-span-full row-start-1 border-x border-x-(color:--pattern-fg) bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed"></div>
      <div className="relative left--1px col-start-4 row-span-full row-start-1 border-x border-x-(color:--pattern-fg) bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed"></div>
      <div className="relative bottom--1px col-span-full col-start-1 row-start-2 h-1px bg-(--pattern-fg)"></div>
      <div className="relative top--1px col-span-full col-start-1 row-start-4 h-1px bg-(--pattern-fg)"></div>
    </div>
  )
}
