// avatarUtils.test.ts
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  MAX_AVATAR_SIZE_MB,
  MAX_AVATAR_SIZE_BYTES,
  resizeImageToSquare,
} from '@/features/account/model/avatarUtils';

describe('avatarUtils', () => {
  describe('Константы', () => {
    it('MAX_AVATAR_SIZE_MB должно быть равно 5', () => {
      expect(MAX_AVATAR_SIZE_MB).toBe(5);
    });

    it('MAX_AVATAR_SIZE_BYTES должно быть корректно рассчитано', () => {
      expect(MAX_AVATAR_SIZE_BYTES).toBe(5 * 1024 * 1024);
    });
  });

  describe('resizeImageToSquare', () => {
    // Сохраняем оригинальные глобальные объекты
    const originalImage = global.Image;
    const originalCreateObjectURL = global.URL.createObjectURL;
    const originalRevokeObjectURL = global.URL.revokeObjectURL;
    const originalCreateElement = document.createElement;

    beforeAll(() => {
      // Мокаем URL
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      global.URL.revokeObjectURL = vi.fn();

      // Мокаем Image - исправленная версия без 'this'
      global.Image = vi.fn().mockImplementation(() => {
        const img = {
          src: '',
          width: 100,
          height: 150,
          onload: vi.fn(),
          onerror: vi.fn(),
        };

        // Сразу вызываем onload в следующем тике
        setTimeout(() => {
          img.onload();
        }, 0);

        return img;
      }) as any;

      // Мокаем document.createElement для canvas
      document.createElement = vi.fn().mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          const canvas = {
            width: 256,
            height: 256,
            getContext: vi.fn().mockReturnValue({
              drawImage: vi.fn(),
            }),
            toBlob: vi.fn((callback: any) => {
              // СИНХРОННЫЙ вызов callback
              callback(new Blob(['test-data'], { type: 'image/webp' }));
            }),
          };
          return canvas as any;
        }
        return originalCreateElement.call(document, tagName);
      });
    });

    afterAll(() => {
      // Восстанавливаем оригинальные объекты
      global.Image = originalImage;
      global.URL.createObjectURL = originalCreateObjectURL;
      global.URL.revokeObjectURL = originalRevokeObjectURL;
      document.createElement = originalCreateElement;
    });

    it('должен успешно изменять размер изображения', async () => {
      const mockFile = new File(['image-data'], 'test.png', {
        type: 'image/png',
      });

      const result = await resizeImageToSquare(mockFile);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/webp');
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
    });

    it('должен использовать размер по умолчанию 256px', async () => {
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
        }),
        toBlob: vi.fn((callback: any) => {
          callback(new Blob(['test'], { type: 'image/webp' }));
        }),
      };

      document.createElement = vi.fn().mockReturnValue(mockCanvas as any);

      const mockFile = new File([''], 'test.png');
      await resizeImageToSquare(mockFile);

      expect(mockCanvas.width).toBe(256);
      expect(mockCanvas.height).toBe(256);
    });

    it('должен использовать переданный размер', async () => {
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
        }),
        toBlob: vi.fn((callback: any) => {
          callback(new Blob(['test'], { type: 'image/webp' }));
        }),
      };

      document.createElement = vi.fn().mockReturnValue(mockCanvas as any);

      const mockFile = new File([''], 'test.png');
      await resizeImageToSquare(mockFile, 512);

      expect(mockCanvas.width).toBe(512);
      expect(mockCanvas.height).toBe(512);
    });

    it('должен выбрасывать ошибку при отсутствии поддержки canvas', async () => {
      const mockCanvas = {
        width: 256,
        height: 256,
        getContext: vi.fn().mockReturnValue(null),
        toBlob: vi.fn(),
      };

      document.createElement = vi.fn().mockReturnValue(mockCanvas as any);

      const mockFile = new File([''], 'test.png');

      await expect(resizeImageToSquare(mockFile)).rejects.toThrow(
        'Canvas not supported',
      );
    });

    it('должен создавать blob с правильными параметрами', async () => {
      const toBlobMock = vi.fn((callback: any) => {
        callback(new Blob(['test'], { type: 'image/webp' }));
      });

      const mockCanvas = {
        width: 256,
        height: 256,
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
        }),
        toBlob: toBlobMock,
      };

      document.createElement = vi.fn().mockReturnValue(mockCanvas as any);

      const mockFile = new File([''], 'test.png');
      await resizeImageToSquare(mockFile);

      expect(toBlobMock).toHaveBeenCalledWith(
        expect.any(Function),
        'image/webp',
        0.9,
      );
    });
  });
});
