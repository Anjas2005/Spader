export function getPageHeight(
  page: number,
  pageHeights: (
    | number
    | undefined
  )[],
  estimatedPageHeight: number,
) {
  return (
    pageHeights[page - 1] ??
    estimatedPageHeight
  );
}

export function getPageOffset(
  page: number,
  pageHeights: (
    | number
    | undefined
  )[],
  estimatedPageHeight: number,
) {
  if (page <= 1) {
    return 0;
  }

  let offset = 0;

  for (
    let current = 1;
    current < page;
    current++
  ) {
    offset += getPageHeight(
      current,
      pageHeights,
      estimatedPageHeight,
    );
  }

  return offset;
}
