export const FILE_UPLOAD_ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
export const FILE_UPLOAD_SUPPORTED_TEXT = 'Supported: PDF, DOC, DOCX, JPG, JPEG, PNG (max 5MB)';

export const VENDOR_FILE_UPLOAD_ACCEPT = '.pdf';
export const VENDOR_FILE_UPLOAD_SUPPORTED_TEXT = 'Supported Format: PDF (max 30MB each)';

export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_FILE_TYPES: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  SUPPORTED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ],
  ERROR_MESSAGES: {
    SIZE_EXCEEDED: `File size exceeds 5MB`,
    INVALID_TYPE: `File type not supported. Allowed: .pdf, .doc, .docx, .jpg, .jpeg, .png`
  }
};

export function validateFile(file: File): { isValid: boolean; errorMessage?: string } {
  if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      isValid: false,
      errorMessage: FILE_UPLOAD_CONFIG.ERROR_MESSAGES.SIZE_EXCEEDED
    };
  }

  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!FILE_UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(fileExtension)) {
    return {
      isValid: false,
      errorMessage: FILE_UPLOAD_CONFIG.ERROR_MESSAGES.INVALID_TYPE
    };
  }

  return { isValid: true };
}

export const validateImageFile = validateFile;

export const IMAGE_FILE_UPLOAD_ACCEPT = '.jpg,.jpeg,.png';
export const IMAGE_FILE_UPLOAD_SUPPORTED_TEXT = 'Supported: JPG, JPEG, PNG (max 5MB)';
