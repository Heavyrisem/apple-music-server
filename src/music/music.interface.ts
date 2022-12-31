export interface MusicModuleOptions {
  youtubeApiKey: string;
  // musicAuthorization: string;
  // musicCookie: string;
  tempDir: string;
}

export interface MusicInfo {
  videoId: string;
  musicId: string;
  title: string;
  album: string;
  artists: string[];
  thumbnail: string;
  isExplicit: boolean;
}

export interface MusicData {
  videoId: string;
  data: Buffer;
}

export interface MusicLyrics {
  videoId: string;
  lyrics: string;
}
