import { Request, Response } from 'express';
export declare const register: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const login: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const getProfile: (req: Request, res: Response) => Promise<Response | void>;
export declare const updateProfile: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<Response | void>))[];
export declare const changePassword: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<Response | void>))[];
//# sourceMappingURL=authController.d.ts.map