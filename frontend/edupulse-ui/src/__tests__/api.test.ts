import { compressImage, teacherApi, dietApi } from '../lib/api';

// Mock axios
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      post: jest.fn(),
      get: jest.fn(),
    })),
    get: jest.fn(),
  },
}));

// Mock crypto for phone hashing
global.crypto = {
  subtle: {
    digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
  },
} as any;

describe('API Client', () => {
  describe('compressImage', () => {
    it('returns original file if size is below limit', async () => {
      const smallFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(smallFile, 'size', { value: 100 * 1024 }); // 100KB

      const result = await compressImage(smallFile, 500);
      expect(result).toBe(smallFile);
    });

    it('compresses file if size exceeds limit', async () => {
      const largeFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 1000 * 1024 }); // 1MB

      // Mock FileReader
      global.FileReader = jest.fn().mockImplementation(() => ({
        readAsDataURL: jest.fn(function(this: any) {
          setTimeout(() => {
            this.onload({ target: { result: 'data:image/jpeg;base64,test' } });
          }, 0);
        }),
      })) as any;

      // Mock Image
      global.Image = jest.fn().mockImplementation(() => ({
        onload: null,
        src: '',
        width: 1000,
        height: 1000,
      })) as any;

      // Mock canvas
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          drawImage: jest.fn(),
        })),
        toBlob: jest.fn((callback: (blob: Blob | null) => void) => {
          const blob = new Blob(['compressed'], { type: 'image/jpeg' });
          callback(blob);
        }),
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

      const result = await compressImage(largeFile, 500, 0.6);
      expect(result).toBeInstanceOf(File);
      expect(result.size).toBeLessThanOrEqual(500 * 1024);
    });
  });

  describe('teacherApi.createTeacherQuery', () => {
    it('handles 422 validation errors with friendly message', async () => {
      const axios = require('axios').default;
      axios.create().post.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            error_message: 'We need a little more info — please add the subject or a short example.',
          },
        },
      });

      const result = await teacherApi.createTeacherQuery({
        text: 'test',
        cluster: 'Cluster A',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('more info');
    });

    it('handles network errors', async () => {
      const axios = require('axios').default;
      axios.create().post.mockRejectedValueOnce({
        message: 'Network Error',
        response: undefined,
      });

      const result = await teacherApi.createTeacherQuery({
        text: 'test',
        cluster: 'Cluster A',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });
});
