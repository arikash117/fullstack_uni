// tests/fixtures/api-helpers.ts
import { APIRequestContext } from '@playwright/test';

export const API_URL = 'http://localhost:8000';

export const ADMIN_CREDENTIALS = {
  name: 'test_admin',
  email: 'test_admin@example.com',
  password: 'TestAdmin123!',
};

export interface SignupResponse {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  role: string;
  user_id: number;
}

export interface TestUser {
  id: number;
  email: string;
  username: string;
  password: string;
}

export async function createTestUserViaAPI(
  request: APIRequestContext,
  prefix: string = 't'
): Promise<TestUser> {
  const random = Math.random().toString(36).substring(2, 8);
  
  const testUser = {
    email: `${prefix}_${random}@ex.com`,
    username: `${prefix}_${random}`,
    password: 'TestPass123!',
    confirm_password: 'TestPass123!',
  };

  // ✅ ПРАВИЛЬНО: data ВНУТРИ объекта опций
  const response = await request.post(`${API_URL}/auth/signup`, {
    data: testUser,
  });

  if (!response.ok()) {
    const errorText = await response.text();
    console.error(`❌ Signup error:`, {
      status: response.status(),
      body: errorText,
      sent: testUser,
    });
    throw new Error(`Signup failed: ${response.status()} - ${errorText}`);
  }

  const userData: SignupResponse = await response.json();
  
  return {
    ...userData,
    password: testUser.password,
  };
}

export async function getAdminToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      identifier: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Admin login failed: ${response.status()}`);
  }

  const loginData: LoginResponse = await response.json();
  
  if (loginData.role !== 'admin') {
    throw new Error(`Expected admin role, got: ${loginData.role}`);
  }

  return loginData.access_token;
}

export async function changeUserRoleViaAPI(
  request: APIRequestContext,
  userId: number,
  newRole: 'admin' | 'user',
  adminToken: string
): Promise<void> {
  const response = await request.patch(`${API_URL}/admin/users/${userId}/role`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    data: { 
      role: newRole 
    },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Change role failed: ${response.status()} - ${errorText}`);
  }
}

export async function checkUserExists(
  request: APIRequestContext,
  userId: number,
  adminToken: string
): Promise<boolean> {
  const response = await request.get(`${API_URL}/admin/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  
  return response.status() === 200;
}