import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsService } from './integrations.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock the UserIntegration model
jest.mock('../users/user-integration.entity', () => {
  const mockQuery = {
    findOne: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  };

  return {
    UserIntegration: {
      query: () => mockQuery,
    },
  };
});

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

describe('IntegrationsService', () => {
  let service: IntegrationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntegrationsService],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInstagramAuthUrl', () => {
    it('should return a valid Instagram OAuth URL when configured', () => {
      process.env.INSTAGRAM_CLIENT_ID = 'test-client-id';
      process.env.INSTAGRAM_REDIRECT_URI = 'http://localhost:5173/profile?instagram=callback';

      const url = service.getInstagramAuthUrl();

      expect(url).toContain('https://api.instagram.com/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=user_profile%2Cuser_media');
    });

    it('should throw BadRequestException when not configured', () => {
      delete process.env.INSTAGRAM_CLIENT_ID;
      delete process.env.INSTAGRAM_REDIRECT_URI;

      expect(() => service.getInstagramAuthUrl()).toThrow(BadRequestException);
    });
  });

  describe('handleInstagramCallback', () => {
    beforeEach(() => {
      process.env.INSTAGRAM_CLIENT_ID = 'test-client-id';
      process.env.INSTAGRAM_CLIENT_SECRET = 'test-secret';
      process.env.INSTAGRAM_REDIRECT_URI = 'http://localhost:5173/profile?instagram=callback';
    });

    it('should throw BadRequestException when env vars are not set', async () => {
      delete process.env.INSTAGRAM_CLIENT_ID;

      await expect(service.handleInstagramCallback(1, 'test-code')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when token exchange fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.handleInstagramCallback(1, 'invalid-code')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getInstagramMedia', () => {
    it('should throw NotFoundException when no integration exists', async () => {
      const { UserIntegration } = require('../users/user-integration.entity');
      UserIntegration.query().findOne.mockResolvedValue(null);

      await expect(service.getInstagramMedia(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('disconnectInstagram', () => {
    it('should throw NotFoundException when no integration exists', async () => {
      const { UserIntegration } = require('../users/user-integration.entity');
      UserIntegration.query().findOne.mockResolvedValue(null);

      await expect(service.disconnectInstagram(1)).rejects.toThrow(NotFoundException);
    });
  });
});
