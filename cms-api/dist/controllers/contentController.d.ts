import { Request, Response } from 'express';
export declare const getStaticPages: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const getStaticPage: (req: Request, res: Response) => Promise<void>;
export declare const createStaticPage: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const updateStaticPage: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const deleteStaticPage: (req: Request, res: Response) => Promise<void>;
export declare const getBlogPosts: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const getBlogPost: (req: Request, res: Response) => Promise<void>;
export declare const createBlogPost: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const updateBlogPost: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const deleteBlogPost: (req: Request, res: Response) => Promise<void>;
export declare const getCategories: (req: Request, res: Response) => Promise<void>;
export declare const getCategory: (req: Request, res: Response) => Promise<void>;
export declare const createCategory: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const updateCategory: (import("express-validator").ValidationChain | ((req: Request, res: Response) => Promise<void>))[];
export declare const deleteCategory: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=contentController.d.ts.map