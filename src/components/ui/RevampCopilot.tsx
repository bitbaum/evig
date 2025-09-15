/**
 * Revamp Copilot Component - Entry Point
 * @fileoverview This file re-exports the refactored RevampCopilot component.
 * It preserves the original import path, ensuring that other parts of the application
 * that depended on the old monolithic component now seamlessly use the new modular version.
 * This is a common practice during refactoring to avoid breaking changes across the codebase.
 */

export { RevampCopilot as default } from '@/components/copilot/RevampCopilot';
