export interface MusicModuleOptions {
  youtubeApiKey: string;
  musicAuthorization: string;
  musicCookie: string;
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
