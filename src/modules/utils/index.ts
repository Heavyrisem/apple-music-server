import { Readable, Stream } from 'node:stream';

export const getBufferFromStream = async (stream: Stream): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>();

    stream.on('data', (chunk) => _buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buf)));
    stream.on('error', (err) => reject(`error converting stream - ${err}`));
  });
};

export const getReadableStreamFromBuffer = (buffer: Buffer): Readable => {
  const stream = new Readable();

  stream.push(buffer);
  stream.push(null);

  return stream;
};
