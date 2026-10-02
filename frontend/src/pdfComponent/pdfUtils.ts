export function getPageHeight(
  page: number,
  pageHeights: (number | undefined)[],
  estimatedPageHeight: number,
) {
  return (
    pageHeights[page - 1] ??
    estimatedPageHeight
  );
}

export function getPageSlotHeight(
  page: number,
  pageHeights: (number | undefined)[],
  estimatedPageHeight: number,
) {
  return (
    getPageHeight(
      page,
      pageHeights,
      estimatedPageHeight,
    ) + 24
  );
}

export function getPageOffset(
  page: number,
  pageHeights: (number | undefined)[],
  estimatedPageHeight: number,
) {
  let offset = 24;

  for (
    let current = 1;
    current < page;
    current++
  ) {
    offset += getPageSlotHeight(
      current,
      pageHeights,
      estimatedPageHeight,
    );
  }

  return offset;
}
