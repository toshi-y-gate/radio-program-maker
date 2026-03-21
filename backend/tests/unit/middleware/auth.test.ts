import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret-key";

import { authMiddleware, generateToken } from "../../../src/middleware/auth";

describe("generateToken", () => {
  it("should generate a valid JWT token", () => {
    const token = generateToken("user123");
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, "test-secret-key") as { userId: string };
    expect(decoded.userId).toBe("user123");
  });
});

describe("authMiddleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = { headers: {} };
    mockRes = { status: statusMock, json: jsonMock };
    mockNext = jest.fn();
  });

  it("should reject request without Authorization header", () => {
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "認証が必要です" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request with invalid Bearer format", () => {
    mockReq.headers = { authorization: "Basic abc" };
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request with invalid token", () => {
    mockReq.headers = { authorization: "Bearer invalid-token" };
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "無効なトークンです" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should accept request with valid token", () => {
    const token = generateToken("user123");
    mockReq.headers = { authorization: `Bearer ${token}` };
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.userId).toBe("user123");
  });
});
