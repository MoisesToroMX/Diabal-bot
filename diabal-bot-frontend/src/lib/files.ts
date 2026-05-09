export const acceptedProductFileExtensions = [".csv", ".xlsx"];

export function isAcceptedProductFile(fileName: string) {
  const normalizedName = fileName.toLowerCase();

  return acceptedProductFileExtensions.some((extension) => {
    return normalizedName.endsWith(extension);
  });
}

export function formatFileSize(bytes: number) {
  const kilobytes = Math.max(1, Math.round(bytes / 1024));

  return `${kilobytes} KB`;
}
