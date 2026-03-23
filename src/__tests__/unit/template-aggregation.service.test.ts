/**
 * Unit Tests: TemplateAggregationService
 *
 * Tests the multi-template aggregation logic:
 * - Weighted averaging of embeddings
 * - Template scoring (quality + pose)
 * - Completion detection
 * - Best template selection
 */

import { describe, it, expect } from '@jest/globals';
import { TemplateAggregationService } from '@/core/application/services/template-aggregation.service';
import type { TemplateData, TemplatePosition } from '@/core/domain/contracts';

describe('TemplateAggregationService', () => {
  let service: TemplateAggregationService;

  beforeEach(() => {
    service = new TemplateAggregationService();
  });

  describe('getPoseValue', () => {
    it('should return correct pose value multipliers', () => {
      expect(service.getPoseValue('center')).toBe(1.0);
      expect(service.getPoseValue('left')).toBe(0.8);
      expect(service.getPoseValue('right')).toBe(0.8);
      expect(service.getPoseValue('up')).toBe(0.6);
      expect(service.getPoseValue('down')).toBe(0.6);
    });
  });

  describe('calculateTemplateScore', () => {
    it('should calculate score as quality(0.7) + pose(0.3)', () => {
      const template: TemplateData = {
        faceId: 'face_001',
        position: 'center',
        embedding: Buffer.from(new Float32Array(512)),
        faceQualityScore: 0.9,
      };

      const score = service.calculateTemplateScore(template);
      // Expected: (0.9 * 0.7) + (1.0 * 0.3) = 0.63 + 0.3 = 0.93
      expect(score).toBeCloseTo(0.93);
    });

    it('should favor high-quality center faces', () => {
      const centerHighQuality: TemplateData = {
        faceId: 'face_001',
        position: 'center',
        embedding: Buffer.from(new Float32Array(512)),
        faceQualityScore: 0.95,
      };

      const leftLowQuality: TemplateData = {
        faceId: 'face_002',
        position: 'left',
        embedding: Buffer.from(new Float32Array(512)),
        faceQualityScore: 0.70,
      };

      const centerScore = service.calculateTemplateScore(centerHighQuality);
      const leftScore = service.calculateTemplateScore(leftLowQuality);

      expect(centerScore).toBeGreaterThan(leftScore);
    });
  });

  describe('isTemplateSetComplete', () => {
    it('should return true when all 5 poses present', () => {
      const templates: TemplateData[] = [
        {
          faceId: 'f1',
          position: 'center',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.85,
        },
        {
          faceId: 'f2',
          position: 'left',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.82,
        },
        {
          faceId: 'f3',
          position: 'right',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.83,
        },
        {
          faceId: 'f4',
          position: 'up',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.75,
        },
        {
          faceId: 'f5',
          position: 'down',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.76,
        },
      ];

      expect(service.isTemplateSetComplete(templates)).toBe(true);
    });

    it('should return false when poses missing', () => {
      const templates: TemplateData[] = [
        {
          faceId: 'f1',
          position: 'center',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.85,
        },
        {
          faceId: 'f2',
          position: 'left',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.82,
        },
        {
          faceId: 'f3',
          position: 'right',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.83,
        },
        // Missing 'up' and 'down'
      ];

      expect(service.isTemplateSetComplete(templates)).toBe(false);
    });

    it('should return false when any quality score is 0', () => {
      const templates: TemplateData[] = [
        {
          faceId: 'f1',
          position: 'center',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.85,
        },
        {
          faceId: 'f2',
          position: 'left',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0,
        },
        {
          faceId: 'f3',
          position: 'right',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.83,
        },
        {
          faceId: 'f4',
          position: 'up',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.75,
        },
        {
          faceId: 'f5',
          position: 'down',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.76,
        },
      ];

      expect(service.isTemplateSetComplete(templates)).toBe(false);
    });
  });

  describe('selectBestTemplate', () => {
    it('should return highest-score template', () => {
      const templates: TemplateData[] = [
        {
          faceId: 'f1',
          position: 'center',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.95,
        },
        {
          faceId: 'f2',
          position: 'left',
          embedding: Buffer.from(new Float32Array(512)),
          faceQualityScore: 0.82,
        },
      ];

      const best = service.selectBestTemplate(templates);
      expect(best.faceId).toBe('f1');
      expect(best.position).toBe('center');
    });

    it('should throw when no templates provided', () => {
      expect(() => service.selectBestTemplate([])).toThrow();
    });
  });

  describe('averageEmbeddings', () => {
    it('should calculate weighted average of embeddings', () => {
      // Create simple embeds for testing
      const embed1 = new Float32Array([1, 2, 3]); // ... 512 dims
      const embed2 = new Float32Array([2, 3, 4]);
      const embed3 = new Float32Array([3, 4, 5]);

      const templates: TemplateData[] = [
        {
          faceId: 'f1',
          position: 'center',
          embedding: Buffer.from(embed1.buffer),
          faceQualityScore: 0.9,
        },
        {
          faceId: 'f2',
          position: 'left',
          embedding: Buffer.from(embed2.buffer),
          faceQualityScore: 0.8,
        },
        {
          faceId: 'f3',
          position: 'right',
          embedding: Buffer.from(embed3.buffer),
          faceQualityScore: 0.75,
        },
      ];

      // Should not throw
      expect(() => service.averageEmbeddings(templates)).not.toThrow();

      const result = service.averageEmbeddings(templates);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.byteLength).toBeGreaterThan(0);
    });

    it('should L2-normalize the result', () => {
      const templates: TemplateData[] = Array.from({ length: 5 }, (_, i) => ({
        faceId: `f${i}`,
        position: (['center', 'left', 'right', 'up', 'down'] as const)[i],
        embedding: Buffer.from(new Float32Array(512).fill(1.0)),
        faceQualityScore: 0.85,
      }));

      const result = service.averageEmbeddings(templates);
      const resultVec = new Float32Array(result.buffer);

      // Calculate L2 norm
      let norm = 0;
      for (let i = 0; i < resultVec.length; i += 1) {
        norm += resultVec[i] * resultVec[i];
      }
      norm = Math.sqrt(norm);

      // After L2 normalization, norm should be close to 1
      expect(norm).toBeCloseTo(1, 1);
    });
  });
});
