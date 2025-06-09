import apiClient from "./api";

/**
 * Service para gerenciar upload de imagens de perfil
 */
class ProfileImageService {
  /**
   * Faz upload de uma imagem de perfil para um usuário específico
   * @param {File} file - Arquivo de imagem (JPG ou PNG)
   * @param {number} userId - ID do usuário
   * @returns {Promise<string>} URL da imagem uploadada
   */
  async uploadProfileImage(file, userId) {
    try {
      // Validações no frontend
      if (!file) {
        throw new Error("Arquivo é obrigatório");
      }

      if (!userId) {
        throw new Error("ID do usuário é obrigatório");
      }

      // Validar extensão do arquivo
      const allowedExtensions = [".jpg", ".jpeg", ".png"];
      const fileName = file.name.toLowerCase();
      const hasValidExtension = allowedExtensions.some((ext) =>
        fileName.endsWith(ext)
      );

      if (!hasValidExtension) {
        throw new Error(
          "Formato de arquivo não permitido. Apenas JPG e PNG são aceitos."
        );
      }

      // Validar tamanho do arquivo (opcional - adicione conforme necessário)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("Arquivo muito grande. Tamanho máximo permitido: 5MB");
      }

      // Criar FormData para envio
      const formData = new FormData();
      formData.append("file", file);

      // Configurar headers para multipart/form-data
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      // Fazer requisição
      const response = await apiClient.post(
        `cloudstorage/file/profile-image/${userId}`,
        formData,
        config
      );

      return response.data;
    } catch (error) {
      // Tratar diferentes tipos de erro
      if (error.response) {
        // Erro da API
        const { status, data } = error.response;

        switch (status) {
          case 400:
            throw new Error(data || "Requisição inválida");
          case 401:
            throw new Error("Usuário não autenticado");
          case 403:
            throw new Error(
              "Você não tem permissão para alterar a imagem de perfil deste usuário"
            );
          case 500:
            throw new Error(
              "Erro interno do servidor. Tente novamente mais tarde."
            );
          default:
            throw new Error(data || "Erro desconhecido");
        }
      } else if (error.request) {
        // Erro de rede
        throw new Error(
          "Erro de conexão. Verifique sua internet e tente novamente."
        );
      } else {
        // Erro de validação local ou outros
        throw error;
      }
    }
  }

  /**
   * Preview de imagem antes do upload (utilitário)
   * @param {File} file - Arquivo de imagem
   * @returns {Promise<string>} Data URL para preview
   */
  createImagePreview(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("Arquivo deve ser uma imagem"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validar se o arquivo é uma imagem válida
   * @param {File} file - Arquivo para validar
   * @returns {boolean} true se válido
   */
  isValidImageFile(file) {
    if (!file) return false;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    const allowedExtensions = [".jpg", ".jpeg", ".png"];

    const fileName = file.name.toLowerCase();
    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    return hasValidType && hasValidExtension;
  }

  /**
   * Obtém URL assinada para imagem de perfil de um usuário
   * @param {number} userId - ID do usuário
   * @returns {Promise<string>} URL assinada temporária para acessar a imagem
   */
  async getProfileImageUrl(userId) {
    try {
      if (!userId) {
        throw new Error("ID do usuário é obrigatório");
      }

      const response = await apiClient.get(`cloudstorage/file/profile-image/${userId}`);

      return response.data;
    } catch (error) {
      // Tratar diferentes tipos de erro
      if (error.response) {
        // Erro da API
        const { status, data } = error.response;

        switch (status) {
          case 401:
            throw new Error("Usuário não autenticado");
          case 404:
            throw new Error(
              "Imagem de perfil não encontrada para este usuário"
            );
          case 500:
            throw new Error(
              "Erro interno do servidor. Tente novamente mais tarde."
            );
          default:
            throw new Error(data || "Erro desconhecido");
        }
      } else if (error.request) {
        // Erro de rede
        throw new Error(
          "Erro de conexão. Verifique sua internet e tente novamente."
        );
      } else {
        throw error;
      }
    }
  }
}

export default new ProfileImageService();
