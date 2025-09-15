import { StorageAdapter, AINativeCMSConfig } from '../types'
import { MemoryStorageAdapter } from './MemoryStorageAdapter'
import { PostgreSQLStorageAdapter } from './PostgreSQLStorageAdapter'

export function createStorageAdapter(config: AINativeCMSConfig['storage']): StorageAdapter {
  switch (config.adapter) {
    case 'memory':
      return new MemoryStorageAdapter(config.config)
    
    case 'postgres':
      return new PostgreSQLStorageAdapter(config.config as any)
    
    case 'mysql':
      throw new Error('MySQL adapter not yet implemented')
    
    case 'mongodb':
      throw new Error('MongoDB adapter not yet implemented')
    
    case 'custom':
      if (!config.config.customAdapter) {
        throw new Error('Custom adapter not provided in config')
      }
      return config.config.customAdapter
    
    default:
      throw new Error(`Unknown storage adapter: ${config.adapter}`)
  }
}

export * from './MemoryStorageAdapter'
export * from './PostgreSQLStorageAdapter'