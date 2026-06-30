export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split(
      `/storage/v1/object/public/${bucket}/`,
    );
    return pathParts[1] || null;
  } catch {
    return null;
  }
}
