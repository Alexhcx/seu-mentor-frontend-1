interface ProfileImageResponse {
  url: string;
  data?: {
    url: string;
  };
}

export default {
  async uploadProfileImage(file: File, userId: number): Promise<ProfileImageResponse> {
    // Implementation
    throw new Error('Not implemented');
  },

  async getProfileImageUrl(userId: number): Promise<ProfileImageResponse> {
    // Implementation
    throw new Error('Not implemented');
  }
}; 