type BlueBookMarkProps = {
  /** Rendered height in px. Width follows the 3:4 book ratio. */
  size?: number;
  /** Fill colour. Defaults to the brand blue. */
  color?: string;
  className?: string;
  title?: string;
};

/** Brand blue for The Blue Book logo. */
export const BLUE_BOOK_BRAND_BLUE = "#34507e";

/**
 * The Blue Book logo mark: a single-colour blue book with a ribbon
 * cut out of the bottom edge as negative space.
 * Source art lives in /public/brand/blue-book-mark.svg.
 */
export function BlueBookMark({
  size = 20,
  color = BLUE_BOOK_BRAND_BLUE,
  className,
  title,
}: BlueBookMarkProps) {
  return (
    <svg
      viewBox="0 0 24 32"
      width={(size * 24) / 32}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        fill={color}
        d="M3 0H21A3 3 0 0 1 24 3V29A3 3 0 0 1 21 32H19.6V14L17.3 17.4L15 14V32H3A3 3 0 0 1 0 29V3A3 3 0 0 1 3 0Z"
      />
    </svg>
  );
}
