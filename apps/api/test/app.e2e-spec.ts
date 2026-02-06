import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/api/health (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
      
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });

    it('/api (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api')
        .expect(200);
      
      expect(response.body.name).toBe('AdultB2B API');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Authentication', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';
    let accessToken: string;

    it('/api/auth/register (POST) - should register new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          displayName: 'E2E Test User',
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user.displayName).toBe('E2E Test User');
      accessToken = response.body.accessToken;
    });

    it('/api/auth/register (POST) - should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          displayName: 'Duplicate User',
        })
        .expect(409);
    });

    it('/api/auth/register (POST) - should validate input', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
          displayName: '',
        })
        .expect(400);
    });

    it('/api/auth/login (POST) - should login successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      accessToken = response.body.accessToken;
    });

    it('/api/auth/login (POST) - should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('/api/auth/me (GET) - should return current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body.email).toBe(testEmail);
      expect(response.body).toHaveProperty('roles');
      expect(response.body).toHaveProperty('permissions');
    });

    it('/api/auth/me (GET) - should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('/api/auth/refresh (POST) - should refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('accessToken');
    });
  });

  describe('Profiles', () => {
    let accessToken: string;
    const testEmail = `profile-test-${Date.now()}@example.com`;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'SecurePassword123!',
          displayName: 'Profile Test User',
        });
      accessToken = res.body.accessToken;
    });

    it('/api/profiles/me (GET) - should get own profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('skills');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('experiences');
    });

    it('/api/profiles/me (PUT) - should update profile', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          headline: 'Test Headline',
          about: 'Test about section',
          location: 'Test City',
        })
        .expect(200);
      
      expect(response.body.headline).toBe('Test Headline');
      expect(response.body.about).toBe('Test about section');
    });

    it('/api/profiles/lookup/skills (GET) - should get skills list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profiles/lookup/skills')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
    });

    it('/api/profiles/lookup/services (GET) - should get services list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profiles/lookup/services')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/api/profiles/lookup/niches (GET) - should get niches list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profiles/lookup/niches')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Posts & Feed', () => {
    let accessToken: string;
    let postId: string;
    const testEmail = `posts-test-${Date.now()}@example.com`;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'SecurePassword123!',
          displayName: 'Posts Test User',
        });
      accessToken = res.body.accessToken;
    });

    it('/api/posts (POST) - should create a post', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This is a test post from e2e tests',
          publishNow: true,
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('This is a test post from e2e tests');
      expect(response.body.status).toBe('published');
      postId = response.body.id;
    });

    it('/api/posts/:id (GET) - should get post by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .expect(200);
      
      expect(response.body.id).toBe(postId);
      expect(response.body).toHaveProperty('author');
    });

    it('/api/posts/:id (PUT) - should update post', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Updated post content',
        })
        .expect(200);
      
      expect(response.body.content).toBe('Updated post content');
    });

    it('/api/feed (GET) - should get feed', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/feed')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('/api/feed/public (GET) - should get public feed without auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/feed/public')
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
    });

    it('/api/posts/:id (DELETE) - should delete post', async () => {
      await request(app.getHttpServer())
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('Engagement', () => {
    it('/api/engagement/reaction-types (GET) - should get reaction types', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/engagement/reaction-types')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('key');
      expect(response.body[0]).toHaveProperty('label');
      expect(response.body[0]).toHaveProperty('emoji');
    });
  });

  describe('Groups', () => {
    let accessToken: string;
    let groupId: string;
    const testEmail = `groups-test-${Date.now()}@example.com`;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'SecurePassword123!',
          displayName: 'Groups Test User',
        });
      accessToken = res.body.accessToken;
    });

    it('/api/groups (POST) - should create a group', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/groups')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Test Group ${Date.now()}`,
          description: 'A test group',
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('slug');
      groupId = response.body.id;
    });

    it('/api/groups (GET) - should list public groups', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/groups')
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('/api/groups/:id (GET) - should get group details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/groups/${groupId}`)
        .expect(200);
      
      expect(response.body.id).toBe(groupId);
    });

    it('/api/groups/my (GET) - should get user groups', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/groups/my')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      const found = response.body.some((g: { id: string }) => g.id === groupId);
      expect(found).toBe(true);
    });
  });

  describe('Analytics', () => {
    let accessToken: string;
    const testEmail = `analytics-test-${Date.now()}@example.com`;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'SecurePassword123!',
          displayName: 'Analytics Test User',
        });
      accessToken = res.body.accessToken;
    });

    it('/api/analytics/track (POST) - should track event', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/analytics/track')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          eventType: 'profile_view',
          entityType: 'profile',
          entityId: '00000000-0000-0000-0000-000000000001',
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.eventType).toBe('profile_view');
    });
  });

  describe('AI Service', () => {
    let accessToken: string;
    const testEmail = `ai-test-${Date.now()}@example.com`;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'SecurePassword123!',
          displayName: 'AI Test User',
        });
      accessToken = res.body.accessToken;
    });

    it('/api/ai/status (GET) - should return AI status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/ai/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('enabled');
    });
  });
});
