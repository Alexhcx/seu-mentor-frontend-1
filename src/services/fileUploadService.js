import apiClient from "./api";

export const chatService = {
  async uploadFile(file, mentoriaId) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post(
        `/cloudstorage/file/upload/${mentoriaId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },

          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Upload progress: ${percentCompleted}%`);
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      throw error;
    }
  },

  validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB padrão
      allowedTypes = [
        "image/*",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "application/zip",
        "application/x-rar-compressed",
      ],
    } = options;

    // Validar tamanho
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `O arquivo excede o tamanho máximo permitido de ${
          maxSize / (1024 * 1024)
        }MB`,
      };
    }

    const fileType = file.type;
    const isAllowed = allowedTypes.some((type) => {
      if (type.endsWith("/*")) {
        return fileType.startsWith(type.replace("/*", ""));
      }
      return fileType === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: "Tipo de arquivo não permitido",
      };
    }

    return { valid: true };
  },

  formatFileName(filename, maxLength = 30) {
    if (!filename || filename.length <= maxLength) return filename;

    const extension = filename.split(".").pop();
    const nameWithoutExtension = filename.substring(
      0,
      filename.lastIndexOf(".")
    );
    const truncatedName = nameWithoutExtension.substring(
      0,
      maxLength - extension.length - 4
    );

    return `${truncatedName}...${extension}`;
  },
};

export default chatService;
