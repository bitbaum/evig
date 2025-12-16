import { Request, Response } from 'express';
export declare const getUsers: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const getUser: (req: Request, res: Response) => Promise<void>;
export declare const createUser: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const updateUser: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const deleteUser: (req: Request, res: Response) => Promise<Response | void>;
export declare const getSystemStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map