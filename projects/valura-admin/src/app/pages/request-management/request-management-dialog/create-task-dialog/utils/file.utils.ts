export class FileUtils {
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isValidFileType(fileName: string, allowedTypes: string[]): boolean {
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(extension);
  }

  static isValidFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }

  static extractFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }

  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}
