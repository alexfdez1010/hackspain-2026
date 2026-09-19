/** Small, consistent functional icons; decorative inside named HeroUI controls. */
export function AssistantIcon({
  name,
  className = 'size-4',
}: {
  name:
    | 'arrow'
    | 'close'
    | 'reset'
    | 'stop'
    | 'copy'
    | 'check'
    | 'page'
    | 'pulse'
    | 'chevron';
  className?: string;
}) {
  const paths = {
    arrow: 'M12 19V5m-6 6 6-6 6 6',
    close: 'm6 6 12 12M6 18 18 6',
    reset: 'M4 10a8 8 0 1 1 1 8M4 4v6h6',
    stop: 'M7 7h10v10H7z',
    copy: 'M8 8h11v12H8zM15 8V4H4v12h4',
    check: 'm5 12 4 4L19 6',
    page: 'M7 3h7l4 4v14H7zM14 3v5h4M10 12h5m-5 4h5',
    pulse: 'M2 12h5l3-7 4 14 3-7h5',
    chevron: 'm9 5 7 7-7 7',
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}
